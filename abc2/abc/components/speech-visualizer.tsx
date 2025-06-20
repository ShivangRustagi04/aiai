"use client"

import { useEffect, useRef, useState } from "react"

interface SpeechVisualizerProps {
  isActive: boolean
  type: "speaking" | "listening" | "idle"
  audioStream?: MediaStream
}

export default function SpeechVisualizer({ isActive, type, audioStream }: SpeechVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const analyserRef = useRef<AnalyserNode>()
  const [audioContext, setAudioContext] = useState<AudioContext>()

  useEffect(() => {
    if (audioStream && !audioContext) {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = context.createAnalyser()
      const source = context.createMediaStreamSource(audioStream)

      analyser.fftSize = 256
      source.connect(analyser)

      setAudioContext(context)
      analyserRef.current = analyser
    }
  }, [audioStream, audioContext])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      if (isActive && analyserRef.current) {
        // Real audio visualization
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteFrequencyData(dataArray)

        const barWidth = width / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.8

          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
          if (type === "speaking") {
            gradient.addColorStop(0, "#10b981")
            gradient.addColorStop(1, "#34d399")
          } else if (type === "listening") {
            gradient.addColorStop(0, "#3b82f6")
            gradient.addColorStop(1, "#60a5fa")
          } else {
            gradient.addColorStop(0, "#6b7280")
            gradient.addColorStop(1, "#9ca3af")
          }

          ctx.fillStyle = gradient
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
          x += barWidth
        }
      } else if (isActive) {
        // Simulated visualization when no real audio
        const bars = 32
        const barWidth = width / bars

        for (let i = 0; i < bars; i++) {
          const barHeight = Math.random() * height * 0.6 + 10

          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
          if (type === "speaking") {
            gradient.addColorStop(0, "#10b981")
            gradient.addColorStop(1, "#34d399")
          } else if (type === "listening") {
            gradient.addColorStop(0, "#3b82f6")
            gradient.addColorStop(1, "#60a5fa")
          }

          ctx.fillStyle = gradient
          ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight)
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, type])

  return <canvas ref={canvasRef} width={300} height={60} className="w-full h-full rounded-md bg-gray-900/50" />
}
