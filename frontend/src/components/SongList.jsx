import {useState, useEffect} from 'react'
import {getSongs, deleteSong} from '../api/client'

function SongList({onEdit, refreshSignal}){
    const [songs, setSongs] = useState([])

    useEffect(()=>{
        getSongs().then((data)=>setSongs(data))
    },[refreshSignal])

async function handleDelete(id){
    await deleteSong(id)
    setSongs(songs.filter((song)=>song.id!==id))
} return (
    <ul>
        {songs.map((song)=>(
            <li key ={song.id}>
                {song.title}{song.composer_arranger && `-${song.composer_arranger}`}
            <button onClick={()=> onEdit(song)}>Edit</button>
            <button onClick={()=> handleDelete(song.id)}>Delete</button>
            </li>
        ))}
    </ul>
)
}

export default SongList