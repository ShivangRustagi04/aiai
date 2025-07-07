"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

interface AIInterviewerAvatarProps {
  isSpeaking: boolean
  avatarSrc: string
}

const AIInterviewerAvatar: React.FC<AIInterviewerAvatarProps> = ({ isSpeaking, avatarSrc }) => {

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Main avatar circle */}
      <div
        className={`w-32 h-32 rounded-full flex items-center justify-center ${
          isSpeaking
            ? "bg-green-500"
            : "bg-green-600"
        }`}
        style={{
          ...(isSpeaking
            ? {
                animation: 'breathe 1.2s ease-in-out infinite'
              }
            : {})
        }}
      >
        <span className="text-white text-4xl font-bold font-sans">G</span>
      </div>

      {/* Custom CSS for breathing animation */}
      <style jsx>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  )
}

export default AIInterviewerAvatar