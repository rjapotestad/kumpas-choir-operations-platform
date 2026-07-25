import { useState, useEffect, useRef } from 'react'
import { DndContext } from '@dnd-kit/core'
import { toPng } from 'html-to-image'
import './App.css'
import SongList from './components/SongList'
import SongForm from './components/SongForm'
import TimeSlotGrid from './components/TimeSlotGrid'
import {
  getRehearsalPlans,
  createRehearsalPlan,
  getRehearsalPlan,
  addPlanItem,
  updatePlanItem,
  deletePlanItem,
} from './api/client'
import { slotIndexToTime, timeToSlotIndex } from './utils/timeGrid'

function App() {
  const [editingSong, setEditingSong] = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [activePlan, setActivePlan] = useState(null)
  const planExportRef = useRef(null)

  function handleSaved() {
    setEditingSong(null)
    setRefreshSignal((prev) => prev + 1)
  }

  // Load the active plan on first render — create one if none exists yet
  useEffect(() => {
    function getLocalDateString() {
      // toISOString() converts to UTC, which can land on the wrong calendar
      // day depending on timezone — build the string from local date parts instead
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    async function loadOrCreatePlan() {
      const plans = await getRehearsalPlans()
      if (plans.length > 0) {
        setActivePlan(plans[0])
      } else {
        const newPlan = await createRehearsalPlan({ date: getLocalDateString(), title: 'Untitled Rehearsal' })
        setActivePlan(newPlan)
      }
    }
    loadOrCreatePlan()
  }, [])

  async function refreshActivePlan() {
    const updated = await getRehearsalPlan(activePlan.id)
    setActivePlan(updated)
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return // dropped outside any valid slot

    const slotIndex = over.data.current?.slotIndex
    if (slotIndex === undefined) return

    const draggedSong = active.data.current?.song
    const draggedItem = active.data.current?.item

    // Find whatever item (if any) currently occupies the target slot —
    // excluding the item being moved itself, if this is a move
    const existingItem = activePlan.items.find(
      (item) =>
        item.start_time &&
        timeToSlotIndex(item.start_time) === slotIndex &&
        item.id !== draggedItem?.id
    )

    if (draggedSong) {
      // Dropped a library song onto a slot — replace whatever's there, then create
      if (existingItem) {
        await deletePlanItem(activePlan.id, existingItem.id)
      }
      await addPlanItem(activePlan.id, {
        song_id: draggedSong.id,
        start_time: slotIndexToTime(slotIndex),
        duration_minutes: 15,
        order_index: slotIndex,
      })
    } else if (draggedItem) {
      // Dragged an already-placed block to a new slot
      const currentSlot = timeToSlotIndex(draggedItem.start_time)
      if (currentSlot === slotIndex) return // dropped back on itself, no-op

      if (existingItem) {
        await deletePlanItem(activePlan.id, existingItem.id)
      }
      await updatePlanItem(activePlan.id, draggedItem.id, {
        start_time: slotIndexToTime(slotIndex),
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

  async function handleExportPlan() {
    if (!planExportRef.current) return
    const dataUrl = await toPng(planExportRef.current, { backgroundColor: '#ffffff' })

    const link = document.createElement('a')
    link.download = `rehearsal-plan-${activePlan.date}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <header className="app-header"><h1>Kumpas</h1></header>
      <div className="app-layout">
        <div className="library-column">
          <h2>Song Library</h2>
          <SongForm existingSong={editingSong} onSaved={handleSaved} />
          <SongList onEdit={setEditingSong} refreshSignal={refreshSignal} />
        </div>

        <div className="builder-column">
          <h2>Rehearsal Plan</h2>
          {activePlan ? (
            <>
              <button onClick={handleExportPlan}>Export as Image</button>
              <div ref={planExportRef}>
                <TimeSlotGrid
                  items={activePlan.items}
                  onRemoveItem={handleRemoveItem}
                  onResizeItem={handleResizeItem}
                />
              </div>
            </>
          ) : (
            <p>Loading plan...</p>
          )}
        </div>
      </div>
    </DndContext>
  )
}

export default App
