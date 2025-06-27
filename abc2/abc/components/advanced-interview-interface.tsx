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
    current_domain: 'unknown',
    current_question: null
  })

  const videoRef = useRef(null)

  // Fetch interview status every 3 seconds
  const fetchInterviewStatus = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/interview-status")
      const data = await res.json()
      console.log("📊 Interview Status:", data)
      setInterviewStatus(data)
      
      // Auto-transition to code editor if backend moved to coding stage
      if (data.stage === 'coding_challenges' && !showCodeEditor && data.current_question) {
        console.log("🚀 Auto-opening code editor with question:", data.current_question)
        setQuestion(data.current_question)
        setShowCodeEditor(true)
      }
    } catch (error) {
      console.error("Failed to fetch interview status:", error)
    }
  }

  // Fetch coding question
  const fetchCodingQuestion = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/current-coding-question")
      const data = await res.json()
      console.log("📝 Coding Question Response:", data)
      
      if (data.question && !data.error) {
        setQuestion(data.question)
        return data.question
      } else {
        console.warn("No question received:", data.error)
        return null
      }
    } catch (error) {
      console.error("Error fetching coding question:", error)
      return null
    }
  }

  // Handle clicking on Code Editor button
  const handleCodeEditorClick = async () => {
    try {
      console.log("🔵 Code Editor button clicked")
      console.log("Current interview status:", interviewStatus)

      // Check if we're already in coding stage
      if (interviewStatus.stage === 'coding_challenges') {
        console.log("✅ Already in coding stage, fetching question...")
        const fetchedQuestion = await fetchCodingQuestion()
        if (fetchedQuestion) {
          setQuestion(fetchedQuestion)
          setShowCodeEditor(true)
        } else {
          alert("⚠️ No coding question available. Please wait or try again.")
        }
        return
      }

      // If not in coding stage, try to trigger transition
      console.log("🚀 Triggering transition to coding stage...")
      const triggerRes = await fetch("http://localhost:5000/api/process-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "ready_for_coding" }),
      })
      
      const triggerData = await triggerRes.json()
      console.log("🧠 Backend response to ready_for_coding:", triggerData)

      if (triggerData.question) {
        setQuestion(triggerData.question)
        setShowCodeEditor(true)
        // Update local status immediately
        setInterviewStatus(prev => ({
          ...prev,
          stage: 'coding_challenges',
          current_question: triggerData.question
        }))
      } else {
        // Wait a moment and fetch status
        setTimeout(async () => {
          await fetchInterviewStatus()
          const fetchedQuestion = await fetchCodingQuestion()
          if (fetchedQuestion) {
            setQuestion(fetchedQuestion)
            setShowCodeEditor(true)
          }
        }, 1000)
      }

    } catch (err) {
      console.error("❌ Error during code editor activation:", err)
      alert("Something went wrong while switching to coding. Check backend.")
    }
  }

  // Toggle Mute
  const toggleMute = () => setIsMuted(!isMuted)

  // Toggle Video
  const toggleVideo = () => setIsVideoOff(!isVideoOff)

  // End Call
  const handleEndCall = () => {
    setInterviewStarted(false)
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    }
  }

  // Start Interview
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

  // Start camera feed
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

  // Re-init camera when returning from IDE
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

  // Listen to user speech
  const listenToUser = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return alert("Speech recognition not supported")

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = async (event) => {
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

    recognition.onerror = (event) => console.error("Speech error:", event.error)
    recognition.start()
  }

  const runCode = async () => {
  setOutput("⚙️ Running code...")

  try {
    const res = await fetch("http://localhost:5000/api/submit-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language: selectedLanguage
      })
    })

    const data = await res.json()
    setOutput(data.output || "✅ Code ran successfully.")

  } catch (err) {
    console.error("❌ Code run error:", err)
    setOutput("❌ Failed to run code. Check console.")
  }
}


  // Submit code to backend
  const submitCode = async () => {
  setIsSubmitted(true)
  setOutput("🚀 Submitting code...")

  try {
    const res = await fetch("http://localhost:5000/api/submit-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language: selectedLanguage
      })
    })

    const data = await res.json()
    console.log("📦 Backend evaluation:", data)

    const finalOutput = data.output || "✅ Code submitted successfully"
    setOutput(finalOutput)

    

    // Now inform backend to continue the interview
    await fetch("http://localhost:5000/api/process-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "done_coding" }),
    })

    setShowCodeEditor(false)

  } catch (err) {
    console.error("❌ Code submission error:", err)
    setOutput("❌ Submission failed. Check console.")
  }
}


  // Poll interview status
  useEffect(() => {
    if (interviewStarted) {
      const interval = setInterval(fetchInterviewStatus, 3000)
      return () => clearInterval(interval)
    }
  }, [interviewStarted])

  // Poll tab/camera warnings
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

  // Debug logging for status changes
  useEffect(() => {
    console.log("🔄 Interview Status Changed:", interviewStatus)
  }, [interviewStatus])

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
          videoRef={videoRef} 
          isVideoOff={isVideoOff}
          isMuted={isMuted}
          isAISpeaking={isAISpeaking}
          isAIListening={!isAISpeaking}
        />
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
          {/* Local Video Feed */}
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

          {/* AI Interviewer Avatar */}
          <div className="relative flex items-center justify-center bg-gray-800 rounded-lg">
            <AIInterviewerAvatar
              isSpeaking={isAISpeaking}
              isListening={!isAISpeaking}
            />
          </div>
        </div>

        {/* Top Bar */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
          <div className="flex items-center space-x-2 text-white">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Technical Interview - Stage: {interviewStatus.stage}
            </span>
            <Users className="w-4 h-4" />
            <span className="text-sm">2</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-center space-x-6">
        <Button
          onClick={() => listenToUser()}
          variant="ghost"
          size="icon"
          className={`rounded-full w-14 h-14 ${isMuted ? 'bg-red-600' : 'bg-green-700'} text-white hover:bg-green-800`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          onClick={handleCodeEditorClick}
          variant="ghost"
          size="icon"
          className="rounded-full w-14 h-14 text-white bg-blue-600 hover:bg-blue-700"
          disabled={!interviewStatus.active}
        >
          {interviewStatus.stage === 'coding_challenges' && !question ? (
            <span className="animate-pulse">⏳</span>
          ) : (
            <Code className="w-5 h-5" />
          )}
        </Button>

        <Button
          onClick={handleEndCall}
          variant="ghost"
          size="icon"
          className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 text-white"
        >
          <PhoneOff className="w-5 h-5" />
        </Button>

        <Button
          onClick={toggleVideo}
          variant="ghost"
          size="icon"
          className={`rounded-full w-14 h-14 ${isVideoOff ? 'bg-red-600' : 'bg-gray-700'} text-white`}
        >
          {isVideoOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
        </Button>
      </div>

      {/* Debug Info */}
    </div>
  )
}
