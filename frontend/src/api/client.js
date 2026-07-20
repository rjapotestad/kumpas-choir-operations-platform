const BASE_URL = 'http://localhost:8000'

export async function getAppInfo() {
  const response = await fetch(`${BASE_URL}/appinfo`)
  return response.json()
}