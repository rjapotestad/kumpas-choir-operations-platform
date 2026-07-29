import { useState } from 'react'
import MemberForm from './MemberForm'
import MemberList from './MemberList'

function MembersView() {
  const [editingMember, setEditingMember] = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(0)

  function handleSaved() {
    setEditingMember(null)
    setRefreshSignal((prev) => prev + 1)
  }

  return (
    <div className="members-view">
      <h2>Members</h2>
      <MemberForm existingMember={editingMember} onSaved={handleSaved} />
      <MemberList onEdit={setEditingMember} refreshSignal={refreshSignal} />
    </div>
  )
}

export default MembersView
