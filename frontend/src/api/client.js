const BASE_URL = 'http://localhost:8000'

export async function getAppInfo() {
  const response = await fetch(`${BASE_URL}/appinfo`)
  return response.json()
}
export async function getSongs(){
  const response = await fetch(`${BASE_URL}/songs`)
  return response.json()
}
export async function createSong(song){
  const response = await fetch (`${BASE_URL}/songs`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(song),
  })
  return response.json()
}
export async function updateSong(id, updates) {
  const response = await fetch(`${BASE_URL}/songs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return response.json()
}

export async function deleteSong(id) {
  const response = await fetch(`${BASE_URL}/songs/${id}`, {
    method: 'DELETE',
  })
  return response.json()
}