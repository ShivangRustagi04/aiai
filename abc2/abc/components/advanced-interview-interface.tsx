"use client"
import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, PhoneOff, Code, Camera, CameraOff, Users, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import CodeEditor from "@/components/code-editor"
import AIInterviewerAvatar from "@/components/ai-interviewer-avatar"
import TranscriptFooter from "./TranscriptFooter"

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function GoogleMeetInterview() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("JavaScript")
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [code, setCode] = useState("// Write your code here...")
  const [output, setOutput] = useState("")
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [question, setQuestion] = useState("")
  const [warnings, setWarnings] = useState<string[]>([])
  const [transcript, setTranscript] = useState<Message[]>([])
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState<string[]>([])
  const [isTabActive, setIsTabActive] = useState(true)
  const [waiting, setWaiting] = useState(false)
  const [gotResponse, setGotResponse] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null);

  interface Message {
    speaker: "AI" | "User"
    message: string
    timestamp: number
  }

  const [interviewStatus, setInterviewStatus] = useState({
    active: false,
    stage: 'not_started',
    skill_questions_asked: 0,
    coding_questions_asked: 0,
    current_domain: 'unknown',
    current_question: null
  })

  const handleUserSend = (message: string) => {
    console.log("User said:", message)
  }

  const fetchInterviewStatus = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/interview-status")
      const data = await res.json()
      console.log("📊 Interview Status:", data)
      setInterviewStatus(data)
      
      if (data.stage === 'coding_challenges' && !showCodeEditor && data.current_question) {
        console.log("🚀 Auto-opening code editor with question:", data.current_question)
        setQuestion(data.current_question)
        setShowCodeEditor(true)
      }
    } catch (error) {
      console.error("Failed to fetch interview status:", error)
    }
  }

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

  const handleCodeEditorClick = async () => {
    try {
      console.log("🔵 Code Editor button clicked")
      console.log("Current interview status:", interviewStatus)

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
        setInterviewStatus(prev => ({
          ...prev,
          stage: 'coding_challenges',
          current_question: triggerData.question
        }))
      } else {
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

  const toggleMute = () => setIsMuted(!isMuted)

  const toggleVideo = () => setIsVideoOff(!isVideoOff)

  const handleEndCall = () => {
    setInterviewStarted(false)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
  }
  
  const listenToUser = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("User said:", transcript);

      const res = await fetch("http://localhost:5000/api/process-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data = await res.json();
      console.log("Backend replied:", data);

      fetchInterviewStatus();
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
    };

    recognition.start();
  };

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

  const runCode = async () => {
    setOutput("⚙️ Running code...");

    try {
      const res = await fetch("http://localhost:5000/api/submit-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
        }),
      });

      const data = await res.json();
      setOutput(data.output || "✅ Code ran successfully.");
    } catch (err) {
      console.error("❌ Code run error:", err);
      setOutput("❌ Failed to run code. Check console.");
    }
  };

  // Initialize media stream
  const initializeMediaStream = async () => {
    try {
      // Stop any existing stream first
      if (videoRef.current?.srcObject) {
        const existingStream = videoRef.current.srcObject as MediaStream;
        existingStream.getTracks().forEach(track => track.stop());
      }

      // Always request video, regardless of isVideoOff state during interview
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: !isMuted 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  };

useEffect(() => {
  if (interviewStarted) {
    initializeMediaStream();
  }

  return () => {
    if (videoRef.current?.srcObject && !interviewStarted) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };
}, [interviewStarted, isMuted]); // Removed isVideoOff from dependencies

  // Effects
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

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        console.log("🔍 Fetching transcript...")
        const res = await fetch("http://localhost:5000/api/transcript")

        if (!res.ok) {
          console.error("❌ Transcript fetch failed:", res.status, res.statusText)
          return
        }

        const data = await res.json()
        console.log("📝 Raw transcript data:", data)

        if (data.transcript && data.transcript.length > 0) {
          console.log("✅ Setting transcript with", data.transcript.length, "entries")
          setTranscript(data.transcript)
        } else {
          console.log("📭 No transcript entries found")
        }
      } catch (err) {
        console.error("❌ Failed to fetch transcript:", err)
      }
    }

    if (interviewStarted) {
      fetchTranscript()
      const interval = setInterval(fetchTranscript, 3000)
      return () => clearInterval(interval)
    }
  }, [interviewStarted])

  useEffect(() => {
    console.log("📋 Transcript updated:", transcript.length, "entries", transcript)
  }, [transcript])

  useEffect(() => {
    initializeMediaStream();
  }, [interviewStarted, isVideoOff, isMuted]);

  useEffect(() => {
    let lastFocusTime = Date.now()
    let violationCooldown = false

    const logViolation = (type: string, message: string) => {
      if (violationCooldown) return
      
      violationCooldown = true
      setTimeout(() => violationCooldown = false, 1000)
      
      const warning = `⚠️ ${message} at ${new Date().toLocaleTimeString()}`
      setTabSwitchWarnings(prev => [...prev, warning])
      
      fetch("http://localhost:5000/api/log-warning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: type, 
          timestamp: Date.now(),
          message: message
        })
      }).catch(console.error)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabActive(false)
        logViolation("tab_switch", "Tab switch detected")
      } else {
        setIsTabActive(true)
      }
    }

    const handleWindowBlur = () => {
      const now = Date.now()
      if (now - lastFocusTime > 500) {
        logViolation("window_blur", "Window focus lost (extension/popup)")
      }
    }

    const handleWindowFocus = () => {
      lastFocusTime = Date.now()
      setIsTabActive(true)
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 0) {
        logViolation("mouse_leave", "Mouse left to top area (possible extension)")
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'e' || e.key === 'b')) {
        logViolation("keyboard_shortcut", "Suspicious keyboard shortcut detected")
      }
    }

    if (interviewStarted) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('blur', handleWindowBlur)
      window.addEventListener('focus', handleWindowFocus)
      document.addEventListener('mouseleave', handleMouseLeave)
      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('blur', handleWindowBlur)
        window.removeEventListener('focus', handleWindowFocus)
        document.removeEventListener('mouseleave', handleMouseLeave)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [interviewStarted])

  useEffect(() => {
    if (interviewStarted) {
      const interval = setInterval(fetchInterviewStatus, 3000)
      return () => clearInterval(interval)
    }
  }, [interviewStarted])

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
          onLanguageChange={setSelectedLanguage}
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
          mediaStreamRef={mediaStreamRef}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {(warnings.length > 0 || tabSwitchWarnings.length > 0) && (
        <div className="bg-red-900 text-red-300 p-2 text-sm flex items-center space-x-2 justify-center">
          <AlertCircle className="w-4 h-4" />
          <span>
            {tabSwitchWarnings.length > 0
              ? tabSwitchWarnings[tabSwitchWarnings.length - 1]
              : warnings[warnings.length - 1]
            }
          </span>
          {tabSwitchWarnings.length > 1 && (
            <span className="bg-red-700 px-2 py-1 rounded text-xs">
              {tabSwitchWarnings.length} violations
            </span>
          )}
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

      {interviewStarted && (
          <TranscriptFooter
            transcript={transcript}
          />
      )}
    </div>
  )
}