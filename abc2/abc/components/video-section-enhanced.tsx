"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import AIInterviewerAvatar from "./ai-interviewer-avatar"

interface VideoSectionEnhancedProps {
  isVideoHidden: boolean
  isMuted: boolean
  isAISpeaking?: boolean
  isAIListening?: boolean
  currentAIMessage?: string
}

export default function VideoSectionEnhanced({
  isVideoHidden,
  isMuted,
  isAISpeaking = false,
  isAIListening = false,
  currentAIMessage,
}: VideoSectionEnhancedProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
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

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        const microphone = audioContext.createMediaStreamSource(stream)

        analyser.fftSize = 256
        microphone.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const checkAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setIsUserSpeaking(average > 20)
          requestAnimationFrame(checkAudioLevel)
        }

        checkAudioLevel()
      } catch (err) {
        console.error("Error accessing camera:", err)
      }
    }

    setupCamera()

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
    <div className="w-64 bg-black flex flex-col space-y-2 p-2">
      {/* AI Interviewer */}
      <div className="h-1/2">
        <AIInterviewerAvatar
          isListening={isAIListening}
          isSpeaking={isAISpeaking}
          currentMessage={currentAIMessage}
        />
      </div>

      {/* Candidate video */}
      <Card className="relative h-1/2 bg-gray-800 overflow-hidden rounded-md border-2 border-gray-600">
        {isVideoHidden ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
            <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center mb-2">
              <span className="text-2xl">👤</span>
            </div>
            <span className="text-gray-400 text-sm">Video Off</span>
          </div>
        ) : (
          <>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Speaking indicator */}
            {hasMounted && isUserSpeaking && !isMuted && (
              <div className="absolute inset-0 border-2 border-green-400 rounded-md animate-pulse" />
            )}

            {/* Muted label */}
            {hasMounted && isMuted && (
              <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs">
                Muted
              </div>
            )}
          </>
        )}

        <div className="absolute bottom-2 left-2 bg-gray-900 bg-opacity-70 px-2 py-1 rounded text-xs">
          Candidate {hasMounted && isUserSpeaking && !isMuted ? "🎤" : ""}
        </div>
      </Card>
    </div>
  )
}
