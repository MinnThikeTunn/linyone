import { Suspense } from 'react'
import AIChatAssistant from './ai-chat'

export default function AIChatWrapper() {
  return (
    <Suspense fallback={null}>
      <AIChatAssistant />
    </Suspense>
  )
}
