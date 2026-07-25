import { useState, useEffect } from 'react'
import { DndContext } from '@dnd-kit/core'
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

  function handleSaved() {
    setEditingSong(null)
    setRefreshSignal((prev) => prev + 1)
  }

  // Load the active plan on first render — create one if none exists yet
  useEffect(() => {
    async function loadOrCreatePlan() {
      const plans = await getRehearsalPlans()
      if (plans.length > 0) {
        setActivePlan(plans[0])
      } else {
        const today = new Date().toISOString().split('T')[0]
        const newPlan = await createRehearsalPlan({ date: today, title: 'Untitled Rehearsal' })
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

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="app-layout">
        <div className="library-column">
          <h1>Kumpas — Song Library</h1>
          <SongForm existingSong={editingSong} onSaved={handleSaved} />
          <SongList onEdit={setEditingSong} refreshSignal={refreshSignal} />
        </div>

        <div className="builder-column">
          <h1>Rehearsal Plan Builder</h1>
          {activePlan ? (
            <TimeSlotGrid
              items={activePlan.items}
              onRemoveItem={handleRemoveItem}
              onResizeItem={handleResizeItem}
            />
          ) : (
            <p>Loading plan...</p>
          )}
        </div>
      </div>
    </DndContext>
  )
}

export default App
