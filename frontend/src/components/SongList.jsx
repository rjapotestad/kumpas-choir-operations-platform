import { useState, useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { getSongs, deleteSong } from '../api/client'

function DraggableSongTitle({ song }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `song-${song.id}`,
    data: { song },
  })

  const style = {
    cursor: 'grab',
    display: 'inline-block',
    ...(transform && { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }),
  }

  return (
    <span ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {song.title}
      {song.composer_arranger && ` — ${song.composer_arranger}`}
    </span>
  )
}

function SongList({onEdit, refreshSignal}){
    const [songs, setSongs] = useState([])

    useEffect(()=>{
        getSongs().then((data)=>setSongs(data))
    },[refreshSignal])

async function handleDelete(id){
    await deleteSong(id)
    setSongs(songs.filter((song)=>song.id!==id))
}
 return (
    <ul className="song-management-list">
        {songs.map((song)=>(
            <li key ={song.id}>
                <DraggableSongTitle song={song} />
            <button onClick={()=> onEdit(song)}>Edit</button>
            <button onClick={()=> handleDelete(song.id)}>Delete</button>
            </li>
        ))}
    </ul>
)
}

export default SongList
