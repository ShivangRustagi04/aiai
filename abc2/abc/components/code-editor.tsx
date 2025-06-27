"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Send } from "lucide-react"

interface CodeEditorProps {
  code: string
  language: string
  onChange: (code: string) => void
  onRun: () => void
  onSubmit: () => void
  output: string
  isSubmitted: boolean
  question?: string
  videoRef?: React.RefObject<HTMLVideoElement>
  isVideoOff?: boolean
  isMuted?: boolean
  isAISpeaking?: boolean
  isAIListening?: boolean
  onVideoStreamReady?: (stream: MediaStream) => void
  problemId?: string
}

export default function CodeEditor({
  code,
  language,
  onChange,
  onRun,
  onSubmit,
  output,
  isSubmitted,
  question,
  videoRef,
  isVideoOff = false,
  isMuted = false,
  isAISpeaking = false,
  isAIListening = false,
  onVideoStreamReady,
  problemId,
}: CodeEditorProps) {
  const [currentQuestion, setCurrentQuestion] = useState(question || "")
  const [loading, setLoading] = useState(!question)
  const [error, setError] = useState<string | null>(null)

  // Fetch coding problem from backend
useEffect(() => {
  if (question) {
    setCurrentQuestion(question)
    setLoading(false)
  } else {
    setCurrentQuestion("⚠️ No coding question available. Please start the interview again.")
    setError("Missing coding question")
    setLoading(false)
  }
}, [question])

  // Initialize video stream
  useEffect(() => {
    const initializeVideo = async () => {
      if (isVideoOff || !videoRef?.current) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: 16/9 }
          },
          audio: !isMuted
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        // Notify parent component about video stream
        if (onVideoStreamReady) {
          onVideoStreamReady(stream)
        }
      } catch (err) {
        console.error('Error accessing camera:', err)
      }
    }

    initializeVideo()

    // Cleanup function
    return () => {
      if (videoRef?.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isVideoOff, isMuted, videoRef, onVideoStreamReady])
  
  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left Panel - Problem & Code */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Problem Statement - Full Width */}
          <div className="h-48 flex flex-col">
            <div className="text-white text-lg font-semibold mb-2 flex items-center flex-shrink-0">
              <span>📋 Problem Statement</span>
              {loading && <span className="ml-2 text-sm text-gray-400">Loading...</span>}
              {error && <span className="ml-2 text-sm text-red-400">Error</span>}
            </div>
            <div className="flex-1 text-gray-300 text-sm font-mono bg-gray-800 p-3 rounded-lg border border-gray-700 overflow-y-auto leading-relaxed">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="text-red-400">{currentQuestion}</div>
              ) : (
                currentQuestion || "No problem available"
              )}
            </div>
          </div>

          {/* Editor Controls */}
          <div className="flex items-center justify-between flex-shrink-0">
            <Select value={language} onValueChange={() => {}}>
              <SelectTrigger className="w-32 h-8 bg-gray-800 border-gray-700 text-white text-sm">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="JavaScript">JavaScript</SelectItem>
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="Java">Java</SelectItem>
                <SelectItem value="C++">C++</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              <Button onClick={onRun} variant="outline" size="sm" className="bg-green-700 border-green-600 text-white hover:bg-green-600">
                <Play className="w-4 h-4 mr-1" />
                Run
              </Button>
              <Button onClick={onSubmit} disabled={isSubmitted} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Send className="w-4 h-4 mr-1" />
                {isSubmitted ? "Submitted" : "Submit"}
              </Button>
            </div>
          </div>

          {/* Code Editor - Takes Remaining Space */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-700 flex-shrink-0">
              <span className="text-white text-sm font-medium">Code Editor</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 bg-gray-900 text-white font-mono text-sm p-4 border border-gray-700 rounded-b-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed min-h-0"
              placeholder="Write your code here..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Panel - Videos & Output */}
        <div className="w-80 flex flex-col gap-4 min-w-0">
          {/* Video Feeds */}
          <div className="flex flex-col gap-3 flex-shrink-0">
            {/* User Video Feed */}
            <div className="relative w-full aspect-video bg-gray-800 rounded-lg overflow-hidden">
              {isVideoOff ? (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl">👤</span>
                    </div>
                    <span className="text-sm text-gray-300">Camera Off</span>
                  </div>
                </div>
              ) : (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-1">
                <span className="text-white text-xs">You</span>
              </div>
              {isMuted && (
                <div className="absolute top-2 left-2 bg-red-500 rounded-full p-1">
                  <div className="w-3 h-3 text-white text-xs flex items-center justify-center">🔇</div>
                </div>
              )}
            </div>

            {/* AI Video Feed - Simple Google Meet Style */}
            <div className="relative w-full aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl text-white">AI</span>
                  </div>
                  <span className="text-sm text-gray-300">AI Interviewer</span>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-1">
                <span className="text-white text-xs">AI Interviewer</span>
              </div>
              {isAISpeaking && (
                <div className="absolute top-2 right-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              )}
              {isAIListening && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>

          {/* Output Panel */}
          <Card className="flex-1 bg-gray-800 border-gray-700 flex flex-col min-h-0">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-white text-sm">Output</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 p-3">
              <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap flex-1 overflow-auto p-3 bg-gray-900 rounded border border-gray-700 min-h-0">
                {output || "Run your code to see output..."}
              </pre>
            </CardContent>
          </Card>

          {/* Submission Status */}
          {isSubmitted && (
            <div className="p-3 bg-green-900 border border-green-700 rounded-lg flex-shrink-0">
              <p className="text-green-200 text-sm">
                ✅ Solution submitted successfully! The AI interviewer will now conclude the interview.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
