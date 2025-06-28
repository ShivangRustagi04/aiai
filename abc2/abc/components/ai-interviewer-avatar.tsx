"use client"

import { Card } from "@/components/ui/card"

interface AIInterviewerAvatarProps {
  isListening: boolean
  isSpeaking: boolean
  currentMessage?: string
  showVoiceActivity?: boolean
}

export default function AIInterviewerAvatar({
  isListening,
  isSpeaking,
  currentMessage,
  showVoiceActivity = false, // turned off by default
}: AIInterviewerAvatarProps) {
  return (
    <Card className="relative h-full w-full flex items-center justify-center bg-gray-800/30 backdrop-blur-md border-0 shadow-lg overflow-hidden">

      {/* Avatar */}
      <div className="flex flex-col items-center space-y-3">
        <div className="w-28 h-28 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white text-5xl font-bold">G</span>
        </div>
        <div className="text-lg font-medium text-white-700">Gyani</div>
      </div>
    </Card>
  )
}
