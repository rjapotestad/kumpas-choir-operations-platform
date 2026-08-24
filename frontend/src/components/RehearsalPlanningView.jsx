import { useState, useEffect, useMemo, useRef } from 'react'
import { DndContext } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { toBlob, toPng } from 'html-to-image'
import SongList from './SongList'
import SongForm from './SongForm'
import TimeSlotGrid from './TimeSlotGrid'
import TimePicker from './TimePicker'
import {
  getSongs,
  updateSong,
  deleteSong,
  updateRehearsalPlan,
  addPlanItem,
  updatePlanItem,
  deletePlanItem,
} from '../api/client'
import { slotIndexToTime, timeToSlotIndex } from '../utils/timeGrid'
import { useActivePlan } from '../hooks/useActivePlan'

function RehearsalPlanningView({ planId, onDateSelect }) {
  const [editingSong, setEditingSong] = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [songs, setSongs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState('manual') // 'manual' | 'genre'
  const { activePlan, refreshActivePlan } = useActivePlan(planId)
  const gridSectionRef = useRef(null)
  const [libraryHeight, setLibraryHeight] = useState(null)
  const [titleDraft, setTitleDraft] = useState('')
  const [copyStatus, setCopyStatus] = useState('idle') // 'idle' | 'copying' | 'copied' | 'error'

  // Local draft so typing doesn't fire a request per keystroke — persisted
  // on blur instead. Only resyncs when the loaded plan itself changes (not
  // on every refreshActivePlan call), so it doesn't clobber an in-progress edit.
  useEffect(() => {
    setTitleDraft(activePlan?.title || '')
  }, [activePlan?.id])

  function handleSaved() {
    setEditingSong(null)
    setRefreshSignal((prev) => prev + 1)
    // A song's title/composer/notes may have changed — if it's currently
    // placed on the plan, the block showing it needs fresh data too,
    // otherwise it keeps showing stale info until a full page reload
    if (activePlan) refreshActivePlan()
  }

  // Fetch the song library whenever something changes it (create/update/delete)
  useEffect(() => {
    getSongs().then(setSongs)
  }, [refreshSignal])

  // Genres already in use, for the song form's autocomplete suggestions —
  // derived from the loaded library rather than a separate endpoint, since
  // the full list is already in memory here.
  const existingGenres = useMemo(
    () => [...new Set(songs.map((s) => s.genre).filter(Boolean))].sort(),
    [songs]
  )

  async function handleDeleteSong(id) {
    try {
      await deleteSong(id)
      setRefreshSignal((prev) => prev + 1)
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return // dropped outside any valid target

    const activeIsSong = typeof active.id === 'string' && active.id.startsWith('song-')
    const overIsSong = typeof over.id === 'string' && over.id.startsWith('song-')

    // Case 1: reordering the song library sidebar itself — only meaningful
    // in Manual order mode; grouped-by-genre songs aren't sortable targets
    // (see SongList), so `overIsSong` won't fire for them anyway, but guard
    // explicitly for clarity.
    if (sortMode === 'manual' && activeIsSong && overIsSong) {
      if (active.id === over.id) return // dropped back on itself, no-op

      const oldIndex = songs.findIndex((s) => `song-${s.id}` === active.id)
      const newIndex = songs.findIndex((s) => `song-${s.id}` === over.id)
      const reordered = arrayMove(songs, oldIndex, newIndex)

      setSongs(reordered) // optimistic UI update, feels instant
      // Persist order for the whole list — simpler and safer than only
      // updating the two swapped items, since arrayMove shifts everything between them
      await Promise.all(reordered.map((song, index) => updateSong(song.id, { order_index: index })))
      return
    }

    // Case 2: dropping a song or a placed block onto the rehearsal plan grid
    const slotIndex = over.data.current?.slotIndex
    if (slotIndex === undefined) return

    const draggedSong = active.data.current?.song
    const draggedItem = active.data.current?.item

    // Find whatever item (if any) currently occupies the target slot —
    // excluding the item being moved itself, if this is a move
    const existingItem = activePlan.items.find(
      (item) =>
        item.start_time &&
        timeToSlotIndex(item.start_time, activePlan.start_time) === slotIndex &&
        item.id !== draggedItem?.id
    )

    if (draggedSong) {
      // Dropped a library song onto a slot — replace whatever's there, then create
      if (existingItem) {
        await deletePlanItem(activePlan.id, existingItem.id)
      }
      await addPlanItem(activePlan.id, {
        song_id: draggedSong.id,
        start_time: slotIndexToTime(slotIndex, activePlan.start_time),
        duration_minutes: 15,
        order_index: slotIndex,
      })
    } else if (draggedItem) {
      // Dragged an already-placed block to a new slot
      const currentSlot = timeToSlotIndex(draggedItem.start_time, activePlan.start_time)
      if (currentSlot === slotIndex) return // dropped back on itself, no-op

      if (existingItem) {
        await deletePlanItem(activePlan.id, existingItem.id)
      }
      await updatePlanItem(activePlan.id, draggedItem.id, {
        start_time: slotIndexToTime(slotIndex, activePlan.start_time),
        order_index: slotIndex,
      })
    } else {
      return
    }

    refreshActivePlan()
  }

  async function handleRemoveItem(itemId) {
    await deletePlanItem(activePlan.id, itemId)
    refreshActivePlan()
  }

  async function handleResizeItem(item, newDurationMinutes) {
    await updatePlanItem(activePlan.id, item.id, { duration_minutes: newDurationMinutes })
    refreshActivePlan()
  }

  async function handleDateChange(newDate) {
    if (onDateSelect) {
      await onDateSelect(newDate)
      return
    }
    refreshActivePlan()
  }

  async function handleStartTimeChange(newStartTime) {
    await updateRehearsalPlan(activePlan.id, { start_time: newStartTime })
    refreshActivePlan()
  }

  async function handleEndTimeChange(newEndTime) {
    await updateRehearsalPlan(activePlan.id, { end_time: newEndTime })
    refreshActivePlan()
  }

  // Copies the plan header + time grid (title, date/time controls, and the
  // time-labelled grid with placed songs) as a PNG — the "whole frame" a
  // director would otherwise screenshot manually to share the rehearsal
  // plan. Clipboard image writes are preferred (no file to manage/attach);
  // browsers that don't support ClipboardItem fall back to a download.
  async function handleCopyImage() {
    if (!gridSectionRef.current) return
    setCopyStatus('copying')
    try {
      // Explicit background — the captured node itself has no background of
      // its own (it relies on the page behind it), so without this the PNG
      // would come out with a transparent gap around the header/grid.
      // Extra top/bottom room, so the gutter's time labels don't get
      // clipped: they're vertically centered on each row's boundary via
      // `translateY(-50%)`, so the very first label sticks up above the
      // grid's own box and the last (boundary) label sticks down below it.
      // Padding alone isn't enough — html-to-image sizes its output canvas
      // from the *original* (unpadded) node's dimensions, so a clone-only
      // `style.padding` just overflows that fixed-size canvas and gets
      // clipped anyway (this is what made the bottom label disappear
      // entirely after the first padding attempt). Explicitly passing a
      // taller `height` alongside the padding grows the canvas to match.
      const extraPadding = 14
      const rect = gridSectionRef.current.getBoundingClientRect()
      const options = {
        backgroundColor: '#042a37',
        pixelRatio: 2,
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height) + extraPadding * 2,
        style: { paddingTop: `${extraPadding}px`, paddingBottom: `${extraPadding}px` },
      }
      if (navigator.clipboard?.write && window.ClipboardItem) {
        const blob = await toBlob(gridSectionRef.current, options)
        if (!blob) throw new Error('Could not generate image')
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })])
        setCopyStatus('copied')
      } else {
        const dataUrl = await toPng(gridSectionRef.current, options)
        const link = document.createElement('a')
        link.download = `rehearsal-plan-${activePlan?.date || 'plan'}.png`
        link.href = dataUrl
        link.click()
        setCopyStatus('downloaded')
      }
    } catch (error) {
      console.error('Failed to copy rehearsal plan image', error)
      setCopyStatus('error')
    } finally {
      setTimeout(() => setCopyStatus('idle'), 1800)
    }
  }

  async function handleTitleBlur() {
    if (!activePlan) return
    const trimmed = titleDraft.trim()
    if (trimmed === (activePlan.title || '')) return // unchanged, skip the request
    // Send "" rather than null to clear the title — the backend's PUT only
    // applies title when `updates.title is not None` (see decisions.md), so
    // null would silently no-op instead of clearing it.
    await updateRehearsalPlan(activePlan.id, { title: trimmed })
    refreshActivePlan()
  }

  // Measure the actual rendered height of the header+grid section, so the
  // library sidebar can match it exactly (extend down to the grid's 8PM
  // line) rather than guessing a pixel value that drifts if the grid's
  // dimensions ever change.
  useEffect(() => {
    if (!gridSectionRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setLibraryHeight(entry.contentRect.height)
      }
    })
    observer.observe(gridSectionRef.current)
    return () => observer.disconnect()
  }, [activePlan])

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="app-layout">
        <div className="library-column" style={{ height: libraryHeight ? `${libraryHeight}px` : undefined }}>
          <h2>Song Library</h2>
          <SongForm existingSong={editingSong} onSaved={handleSaved} existingGenres={existingGenres} />
          <input
            type="text"
            className="song-search-input"
            placeholder="Search songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="song-sort-control">
            <label htmlFor="song-sort-select">Sort by</label>
            <select id="song-sort-select" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
              <option value="manual">Manual order</option>
              <option value="genre">Genre</option>
            </select>
          </div>
          <SongList
            songs={songs}
            onEdit={setEditingSong}
            onDelete={handleDeleteSong}
            searchQuery={searchQuery}
            groupByGenre={sortMode === 'genre'}
          />
        </div>

        <div className="builder-column">
          <div ref={gridSectionRef}>
            <div className="builder-column-header">
              <div className="builder-column-title-row">
                <h2>Rehearsal Plan</h2>
                {activePlan && (
                  <input
                    type="text"
                    className="plan-title-input"
                    placeholder="Untitled Rehearsal"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={handleTitleBlur}
                  />
                )}
              </div>
              {activePlan && (
                <div className="builder-column-controls">
                  <input
                    type="date"
                    className="plan-date-input"
                    value={activePlan.date}
                    onChange={(e) => handleDateChange(e.target.value)}
                  />
                  <TimePicker value={activePlan.start_time} onChange={handleStartTimeChange} />
                  <span className="time-range-separator">to</span>
                  <TimePicker value={activePlan.end_time} onChange={handleEndTimeChange} />
                </div>
              )}
            </div>
            {activePlan ? (
              <TimeSlotGrid
                items={activePlan.items}
                onRemoveItem={handleRemoveItem}
                onResizeItem={handleResizeItem}
                startTime={activePlan.start_time}
                endTime={activePlan.end_time}
              />
            ) : (
              <p>Loading plan...</p>
            )}
          </div>
          {activePlan && (
            <button type="button" onClick={handleCopyImage} disabled={copyStatus === 'copying'}>
              {copyStatus === 'copying' && 'Copying...'}
              {copyStatus === 'copied' && 'Copied to clipboard!'}
              {copyStatus === 'downloaded' && 'Downloaded!'}
              {copyStatus === 'error' && "Couldn't copy — try again"}
              {copyStatus === 'idle' && 'Copy Plan as Image'}
            </button>
          )}
        </div>
      </div>
    </DndContext>
  )
}

export default RehearsalPlanningView
