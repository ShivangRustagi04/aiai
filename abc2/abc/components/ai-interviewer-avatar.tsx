"use client"

import { useState, useEffect } from "react"
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
  showVoiceActivity = true,
}: AIInterviewerAvatarProps) {
  const [pulse, setPulse] = useState(0)
  const [eyeAnimation, setEyeAnimation] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (isSpeaking || isListening) {
      const interval = setInterval(() => {
        const randomFactor = isSpeaking ? 0.8 : 0.3
        setPulse(Math.random() * randomFactor + 0.2)
      }, 150)
      return () => clearInterval(interval)
    } else {
      setPulse(0)
    }
  }, [isSpeaking, isListening])

  // Eye movement animation
  useEffect(() => {
    const eyeInterval = setInterval(() => {
      if (!isSpeaking && !isListening) {
        setEyeAnimation({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 2
        })
      } else {
        setEyeAnimation({ x: 0, y: 0 })
      }
    }, 2000)
    
    return () => clearInterval(eyeInterval)
  }, [isSpeaking, isListening])

  return (
    <Card className="relative h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 border-0 shadow-2xl overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${200 + pulse * 20}px`,
          height: `${200 + pulse * 20}px`,
          background: isSpeaking
            ? 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 40%, transparent 70%)'
            : isListening
            ? 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(100,116,139,0.05) 0%, transparent 70%)',
        }}
      />

      {/* Main Avatar Container */}
      <div
        className={`relative transition-all duration-300 ease-out`}
        style={{
          transform: `scale(${1 + pulse * 0.03})`,
        }}
      >
        {/* Outer ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300
            ${isSpeaking ? 'ring-4 ring-green-400/40 shadow-lg shadow-green-400/20' : 
              isListening ? 'ring-4 ring-blue-400/40 shadow-lg shadow-blue-400/20' : 
              'ring-2 ring-slate-300/50'}`}
          style={{
            width: '160px',
            height: '160px',
            top: '-12px',
            left: '-12px'
          }}
        />

        {/* Avatar Circle */}
        <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-xl flex items-center justify-center overflow-hidden">
          
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          
          {/* Character G */}
          <div className="relative z-10">
            <div 
              className="text-6xl font-bold text-white drop-shadow-lg transition-all duration-300"
              style={{
                transform: `translate(${eyeAnimation.x}px, ${eyeAnimation.y}px)`,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              G
            </div>
          </div>

          {/* Animated elements */}
          {isSpeaking && (
            <>
              {/* Speaking ripples */}
              <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" 
                   style={{ animationDuration: '1s' }} />
              <div className="absolute inset-2 rounded-full border border-white/20 animate-ping" 
                   style={{ animationDuration: '1.5s', animationDelay: '0.5s' }} />
            </>
          )}

          {isListening && (
            <>
              {/* Listening dots around the avatar */}
              <div className="absolute top-4 right-8">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-white/80 rounded-full animate-bounce"
                      style={{ 
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: '1s'
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Subtle breathing animation when idle */}
          {!isSpeaking && !isListening && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute top-6 left-6">
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition-all duration-300
          ${isSpeaking ? 'bg-green-500/20 border-green-400/30 text-green-700' : 
            isListening ? 'bg-blue-500/20 border-blue-400/30 text-blue-700' : 
            'bg-slate-500/20 border-slate-400/30 text-slate-600'}`}>
          
          <div className={`w-2 h-2 rounded-full transition-all duration-300
            ${isSpeaking ? 'bg-green-500 animate-pulse' : 
              isListening ? 'bg-blue-500 animate-pulse' : 
              'bg-slate-400'}`} />
          
          <span>
            {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Voice activity bars */}
      {showVoiceActivity && (isSpeaking || isListening) && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="flex items-end space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150
                  ${isSpeaking ? 'bg-green-400' : 'bg-blue-400'}`}
                style={{
                  height: `${8 + Math.sin((Date.now() / 200) + i) * (pulse * 12 + 4)}px`,
                  opacity: 0.6 + pulse * 0.4
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Message bubble */}
      {isSpeaking && currentMessage && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 max-w-sm w-full px-4">
          <div className="bg-white/95 backdrop-blur-md text-slate-800 text-sm p-4 rounded-2xl shadow-xl border border-white/20 relative">
            <div className="absolute -top-2 left-8 w-4 h-4 bg-white/95 border-l border-t border-white/20 transform rotate-45" />
            <p className="leading-relaxed">{currentMessage}</p>
          </div>
        </div>
      )}

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-12 right-12 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-xl" />
        <div className="absolute bottom-16 left-16 w-20 h-20 bg-gradient-to-br from-indigo-400/10 to-blue-500/10 rounded-full blur-xl" />
      </div>
    </Card>
  )
}
