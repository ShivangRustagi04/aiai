"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"

interface Message {
  speaker: "AI" | "User"
  message: string
  timestamp: number
  isTyping?: boolean
}

interface SimpleTranscriptProps {
  transcript: Message[]
}

const TypewriterText = ({ text, isTyping = false }: { text: string; isTyping?: boolean }) => {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(text)
      return
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 30) // Adjust speed here (lower = faster)

      return () => clearTimeout(timer)
    }
  }, [text, currentIndex, isTyping])

  useEffect(() => {
    // Reset when text changes
    setCurrentIndex(0)
    setDisplayedText(isTyping ? "" : text)
  }, [text, isTyping])

  return (
    <span>
      {displayedText}
      {isTyping && currentIndex < text.length && (
        <span className="animate-pulse text-blue-400">|</span>
      )}
    </span>
  )
}

export default function SimpleTranscript({ transcript }: SimpleTranscriptProps) {
  const transcriptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive with slight delay
    if (transcriptRef.current) {
      setTimeout(() => {
        if (transcriptRef.current) {
          transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
        }
      }, 50)
    }
  }, [transcript])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="bg-gray-800 flex flex-col" style={{height: '120px'}}>
      <div ref={transcriptRef} className="flex-1 overflow-y-auto p-3" style={{scrollBehavior: 'smooth'}}>
        {transcript.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            <p className="text-sm">Transcript will appear here...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transcript.map((msg, index) => (
              <div key={index}>
                <div className="flex items-start space-x-2">
                  <span className={`text-xs font-medium ${msg.speaker === "AI" ? "text-blue-400" : "text-green-400"}`}>
                    {msg.speaker === "AI" ? "Gyani" : "You"}
                  </span>
                  <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-white text-sm mt-1 ml-2 leading-relaxed">
                  {msg.speaker === "AI" ? (
                    <TypewriterText text={msg.message} isTyping={msg.isTyping || false} />
                  ) : (
                    msg.message
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
