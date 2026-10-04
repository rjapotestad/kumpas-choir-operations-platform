import { useState } from 'react'
import MemberForm from './MemberForm'
import MemberList from './MemberList'
import MemberDetailView from './MemberDetailView'

function MembersView() {
  const [editingMember, setEditingMember] = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [viewingMemberId, setViewingMemberId] = useState(null)

  function handleSaved() {
    setEditingMember(null)
    setRefreshSignal((prev) => prev + 1)
  }

  if (viewingMemberId) {
    return <MemberDetailView memberId={viewingMemberId} onBack={() => setViewingMemberId(null)} />
  }

  return (
    <div className="members-view">
      <h2>Members</h2>
      <MemberForm existingMember={editingMember} onSaved={handleSaved} />
      <MemberList onEdit={setEditingMember} onView={setViewingMemberId} refreshSignal={refreshSignal} />
    </div>
  )
}

export default MembersView
