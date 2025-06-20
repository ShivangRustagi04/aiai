"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, PhoneOff, Code, Camera, CameraOff, Users, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import CodeEditor from "@/components/code-editor"
import AIInterviewerAvatar from "@/components/ai-interviewer-avatar"

export default function GoogleMeetInterview() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("JavaScript")
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [code, setCode] = useState("// Write your code here...")
  const [output, setOutput] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [question, setQuestion] = useState("")
  const [warnings, setWarnings] = useState<string[]>([])
  const [interviewStatus, setInterviewStatus] = useState({
    active: false,
    stage: 'not_started',
    skill_questions_asked: 0,
    coding_questions_asked: 0,
    current_domain: 'unknown'
  })
  const videoRef = useRef(null)

  const toggleMute = () => setIsMuted(!isMuted)
  const toggleVideo = () => setIsVideoOff(!isVideoOff)
  const handleCodeEditorClick = () => setShowCodeEditor(true)

  const handleEndCall = () => {
    setInterviewStarted(false)
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    }
  }

  const runCode = () => {
    setOutput(`✅ Code executed successfully.\nHello from ${selectedLanguage}`)
  }

  const submitCode = async () => {
    setIsSubmitted(true)
    setOutput("🚀 Code submitted for evaluation!")

    await fetch("http://localhost:5000/api/process-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "done_coding" }),
    })

    setShowCodeEditor(false)
  }

  const listenToUser = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return alert("Speech recognition not supported")

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript
      console.log("User said:", transcript)

      const res = await fetch("http://localhost:5000/api/process-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      })

      const data = await res.json()
      console.log("Backend replied:", data)
      fetchInterviewStatus()
    }

    recognition.onerror = (event: any) => console.error("Speech error:", event.error)
    recognition.start()
  }

  const fetchInterviewStatus = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/interview-status")
      const data = await res.json()
      setInterviewStatus(data)
    } catch (error) {
      console.error("Failed to fetch interview status:", error)
    }
  }

  const fetchCodingQuestion = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/current-coding-question")
      const data = await res.json()
      if (data.question && !data.error) {
        setQuestion(data.question)
      } else {
        console.warn("No question received:", data.error)
      }
    } catch (error) {
      console.error("Error fetching coding question:", error)
    }
  }

  // 🎬 Start interview
  useEffect(() => {
    if (interviewStarted && !showCodeEditor) {
      fetch("http://localhost:5000/api/start-interview", { method: "POST" })
        .then(res => res.json())
        .then(data => {
          if (data?.message) console.log("Interview started:", data.message)
          fetchInterviewStatus()
        })
        .catch(() => console.error("❌ Failed to start interview"))
    }
  }, [interviewStarted])

  // 🎥 Start camera feed
  useEffect(() => {
    if (interviewStarted && !isVideoOff) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream
        })
        .catch((err) => console.log("Camera access denied:", err))
    }
  }, [interviewStarted, isVideoOff])

  // 🎥 Re-init camera when returning from IDE
  useEffect(() => {
    if (interviewStarted && !showCodeEditor && !isVideoOff) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream
        })
        .catch((err) => console.error("Failed to re-init camera after code editor:", err))
    }
  }, [showCodeEditor])

  // 💬 Fetch coding question dynamically
  useEffect(() => {
    if (showCodeEditor && !question) {
      fetchCodingQuestion()
    }
  }, [showCodeEditor, question])

  // 📶 Poll interview status
  useEffect(() => {
    if (interviewStarted) {
      const interval = setInterval(fetchInterviewStatus, 3000)
      return () => clearInterval(interval)
    }
  }, [interviewStarted])

  // ⚠️ Poll tab/camera warnings
  useEffect(() => {
    const pollWarnings = () => {
      fetch("http://localhost:5000/api/interview-warnings")
        .then(res => res.json())
        .then(data => {
          if (data?.warnings) setWarnings(data.warnings)
        })
        .catch(() => { })
    }

    const interval = setInterval(pollWarnings, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!interviewStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <Button
          onClick={() => setInterviewStarted(true)}
          className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700"
        >
          Start Interview
        </Button>
        <h1 className="text-2xl font-bold mb-4">Welcome to the AI Interview</h1>
        <p className="text-gray-400">Click the button above to begin.</p>
      </div>
    )
  }

  if (showCodeEditor) {
    return (
      <div className="h-screen bg-gray-900 text-white p-4">
        <CodeEditor
          code={code}
          language={selectedLanguage}
          onChange={setCode}
          onRun={runCode}
          onSubmit={submitCode}
          output={output}
          isSubmitted={isSubmitted}
          question={question}
        />
        <div className="mt-4 flex space-x-4">
          <Button onClick={listenToUser} className="bg-green-700 hover:bg-green-800">
            🎤 Listen
          </Button>
          <Button onClick={() => setShowCodeEditor(false)} className="bg-gray-700 hover:bg-gray-600">
            ← Back to Interview
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {warnings.length > 0 && (
        <div className="bg-red-900 text-red-300 p-2 text-sm flex items-center space-x-2 justify-center">
          <AlertCircle className="w-4 h-4" />
          <span>{warnings[warnings.length - 1]}</span>
        </div>
      )}

      <div className="flex-1 relative bg-black overflow-hidden">
        <div className="h-full grid grid-cols-2 gap-2 p-4">
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            {isVideoOff ? (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <CameraOff className="w-16 h-16 text-gray-400" />
                <span className="text-gray-300">Camera is off</span>
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
            <div className="absolute bottom-4 left-4 bg-black/50 rounded-full px-3 py-1">
              <span className="text-white text-sm font-medium">You</span>
            </div>
            {isMuted && (
              <div className="absolute top-4 left-4 bg-red-500 rounded-full p-2">
                <MicOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="relative flex items-center justify-center bg-gray-800 rounded-lg">
            <AIInterviewerAvatar isSpeaking={isAISpeaking} isListening={!isAISpeaking} />
          </div>
        </div>

        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
          <div className="flex items-center space-x-2 text-white">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Technical Interview in Progress</span>
            <Users className="w-4 h-4" />
            <span className="text-sm">2</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 px-6 py-4 flex items-center justify-center space-x-6">
        <Button onClick={toggleMute} variant="ghost" size="icon" className={`rounded-full w-14 h-14 ${isMuted ? 'bg-red-600' : 'bg-gray-700'} text-white`}>
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          onClick={handleCodeEditorClick}
          variant="ghost"
          size="icon"
          className="rounded-full w-14 h-14 text-white bg-blue-600 hover:bg-blue-700"
        >
          <Code className="w-5 h-5" />
        </Button>

        <Button onClick={handleEndCall} variant="ghost" size="icon" className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 text-white">
          <PhoneOff className="w-5 h-5" />
        </Button>

        <Button onClick={toggleVideo} variant="ghost" size="icon" className={`rounded-full w-14 h-14 ${isVideoOff ? 'bg-red-600' : 'bg-gray-700'} text-white`}>
          {isVideoOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  )
}
