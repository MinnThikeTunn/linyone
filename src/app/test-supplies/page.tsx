'use client'

import { useEffect, useState } from 'react'

export default function TestSupplies() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const test = async () => {
      try {
        console.log('🧪 Test: Calling aggregation function client-side')
        const response = await fetch('/api/test-aggregation')
        const result = await response.json()
        console.log('🧪 Test: Got response:', result)
        setData(result)
      } catch (err: any) {
        console.error('🧪 Test: Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    test()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Test Supplies Aggregation</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && data && (
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
