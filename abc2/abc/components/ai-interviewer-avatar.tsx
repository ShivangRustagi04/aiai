"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import Image from "next/image"

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
  showVoiceActivity = true,
}: AIInterviewerAvatarProps) {
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    if (isSpeaking || isListening) {
      const interval = setInterval(() => {
        const randomFactor = isSpeaking ? 0.5 : 0.2
        setPulse(Math.random() * randomFactor + 0.5)
      }, 180)
      return () => clearInterval(interval)
    } else {
      setPulse(0)
    }
  }, [isSpeaking, isListening])

  return (
    <Card className="relative h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 overflow-hidden">
      {/* AI Activity Indicator */}
      <div
        className={`absolute rounded-full transition-all duration-300 pointer-events-none
          ${isSpeaking ? "shadow-green-400/20" : isListening ? "shadow-blue-400/20" : ""}`}
        style={{
          width: `${120 + pulse * 10}px`,
          height: `${120 + pulse * 10}px`,
          backgroundColor: isSpeaking
            ? "rgba(34,197,94,0.15)"
            : isListening
            ? "rgba(59,130,246,0.15)"
            : "transparent",
          filter: isSpeaking || isListening ? "blur(12px)" : "none",
        }}
      />

      {/* Avatar */}
      <div
        className={`relative w-32 h-32 rounded-full overflow-hidden shadow-lg transition-all duration-500
          ${isSpeaking ? "ring-4 ring-green-400/50" : isListening ? "ring-4 ring-blue-400/50" : "ring-2 ring-slate-500/30"}`}
        style={{
          transform: `scale(${1 + pulse * 0.05})`,
        }}
      >
        <Image
          src="/images/hiring-dog.png"
          alt="AI Avatar"
          fill
          className="object-cover transition-all duration-300"
        />

        {/* Speaking dots */}
        {isSpeaking && (
          <div className="absolute bottom-2 right-2 flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )}

        {/* Listening pulse */}
        {isListening && (
          <div className="absolute top-2 left-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping" />
          </div>
        )}
      </div>

      {/* Subtitle */}
      <div className="absolute top-4 left-4 text-xs text-white bg-black/40 px-2 py-1 rounded-full shadow">
        {isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Idle"}
      </div>

      {/* Message */}
      {isSpeaking && currentMessage && (
        <div className="absolute bottom-4 max-w-md px-4">
          <div className="bg-black/70 text-white text-sm p-3 rounded-lg shadow border border-slate-600">
            {currentMessage}
          </div>
        </div>
      )}
    </Card>
  )
}
