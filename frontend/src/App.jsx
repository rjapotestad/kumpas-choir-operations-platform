import { useState, useEffect } from 'react'
import { getAppInfo } from './api/client'

function App() {
  const [appInfo, setAppInfo] = useState(null)

useEffect(() => {
  getAppInfo()
    .then((data) => setAppInfo(data))
    .catch((error) => console.error('Failed to fetch appinfo:', error))
}, [])

  return (
    <div>
      <h1>Kumpas</h1>
      {appInfo ? (
        <p>{appInfo.app} v{appInfo.version} — {appInfo.status}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}

export default App