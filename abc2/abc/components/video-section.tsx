"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import AIInterviewerAvatar from "./ai-interviewer-avatar"

interface VideoSectionProps {
  isVideoHidden: boolean
  isMuted: boolean
  isAISpeaking?: boolean
  isListening?: boolean
  currentAIMessage?: string
}

export default function VideoSection({
  isVideoHidden,
  isMuted,
  isAISpeaking = false,
  isListening = false,
  currentAIMessage = "",
}: VideoSectionProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    // Initialize camera when component mounts
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        setLocalStream(stream)
      } catch (err) {
        console.error("Error accessing camera:", err)
      }
    }

    setupCamera()

    // Cleanup function
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted
      })
    }
  }, [isMuted, localStream])

  return (
    <div className="w-80 bg-slate-900/80 backdrop-blur-sm flex flex-col border-r border-slate-700/50">
      {/* AI Interviewer */}
      <Card className="relative h-1/2 m-3 bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden rounded-xl border border-slate-700/50 shadow-xl">
        <AIInterviewerAvatar
          isListening={isListening}
          isSpeaking={isAISpeaking}
          currentMessage={currentAIMessage}
          showVoiceActivity={false}
        />
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700/50">
          <span className="text-xs font-medium text-slate-300">AI Interviewer</span>
        </div>
      </Card>

      {/* Candidate video */}
      <Card className="relative h-1/2 m-3 bg-slate-800 overflow-hidden rounded-xl border border-slate-700/50 shadow-xl">
        {isVideoHidden ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
            <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mb-3 border border-slate-600/50">
              <span className="text-3xl">👤</span>
            </div>
            <span className="text-slate-400 text-sm font-medium">Video Off</span>
          </div>
        ) : (
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700/50">
          <span className="text-xs font-medium text-slate-300">Candidate</span>
        </div>
        {isMuted && (
          <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium">
            Muted
          </div>
        )}
      </Card>
    </div>
  )
}
