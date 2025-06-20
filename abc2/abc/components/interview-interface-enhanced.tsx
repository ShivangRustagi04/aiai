"use client"

import { useState, useEffect } from "react"
import { useInterviewAPI } from "@/hooks/use-interview-api"
import VideoSection from "./video-section"
import CodeEditor from "./code-editor"
import ControlBar from "./control-bar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"

declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

export default function InterviewInterfaceFlask() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoHidden, setIsVideoHidden] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("Python")
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [output, setOutput] = useState<string>("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  const [code, setCode] = useState({
    Python: "",
    Java: "",
    "C++": "",
    C: "",
    JavaScript: "",
  })

  const { loading, startInterview, executeCode, generateQuestion, evaluateSolution, processSpeech, endInterview } =
    useInterviewAPI()

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript
        console.log("Speech recognized:", transcript)

        const result = await processSpeech(transcript)
        if (result.error) {
          console.error("Speech processing error:", result.error)
        }

        setIsListening(false)
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognition)
    }
  }, [processSpeech])

  const handleStartInterview = async () => {
    const result = await startInterview()
    if (result.data) {
      setInterviewStarted(true)
      setOutput("Interview started! AI interviewer is ready.")
    } else {
      setOutput(`Error starting interview: ${result.error}`)
    }
  }

  const handleCodeChange = (value: string) => {
    setCode({
      ...code,
      [selectedLanguage]: value,
    })
  }

  const handleRunCode = async () => {
    setOutput("Executing code...")
    const result = await executeCode(selectedLanguage, code[selectedLanguage as keyof typeof code])

    if (result.data) {
      setOutput(result.data.output)
    } else {
      setOutput(`Execution error: ${result.error}`)
    }
  }

  const handleSubmitSolution = async () => {
    setOutput("Evaluating solution...")
    setIsSubmitted(true)

    const result = await evaluateSolution(code[selectedLanguage as keyof typeof code], currentQuestion || undefined)

    if (result.data) {
      setOutput(`${result.data.analysis}\n\nVerbal Feedback: ${result.data.verbal_feedback}`)
    } else {
      setOutput(`Evaluation error: ${result.error}`)
    }
  }

  const handleGenerateQuestion = async () => {
    const result = await generateQuestion("python", "coding")

    if (result.data) {
      setCurrentQuestion(result.data.question)
      setIsSubmitted(false)
      setCode({
        ...code,
        [selectedLanguage]: "",
      })
    } else {
      setOutput(`Question generation error: ${result.error}`)
    }
  }

  const handleSpeechToggle = () => {
    if (!recognition) {
      alert("Speech recognition not supported in this browser")
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  const handleEndInterview = async () => {
    const result = await endInterview()
    if (result.data) {
      setInterviewStarted(false)
      setOutput("Interview ended successfully!")
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 p-3 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <h1 className="text-sm font-medium">Technical Interview - AI Interviewer (Flask Backend)</h1>
        </div>
        <div className="flex items-center space-x-4">
          {!interviewStarted ? (
            <Button onClick={handleStartInterview} disabled={loading}>
              {loading ? "Starting..." : "Start Interview"}
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button onClick={handleSpeechToggle} variant={isListening ? "destructive" : "default"} size="sm">
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                {isListening ? "Stop Listening" : "Start Speaking"}
              </Button>
              <Button onClick={handleGenerateQuestion} variant="outline" size="sm">
                New Question
              </Button>
              <Button onClick={handleEndInterview} variant="destructive" size="sm">
                End Interview
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <VideoSection isVideoHidden={isVideoHidden} isMuted={isMuted} />

        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center">
            <span className="mr-2 text-sm">Language:</span>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-32 h-8 text-sm bg-gray-700 border-gray-600">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="Java">Java</SelectItem>
                <SelectItem value="C++">C++</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="JavaScript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentQuestion && (
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <h3 className="font-medium mb-2">Coding Question:</h3>
              <div className="bg-gray-900 p-3 rounded-md text-sm whitespace-pre-wrap">{currentQuestion}</div>
            </div>
          )}

          <CodeEditor
            code={code[selectedLanguage as keyof typeof code]}
            language={selectedLanguage}
            onChange={handleCodeChange}
            onRun={handleRunCode}
            onSubmit={handleSubmitSolution}
            output={output}
            isSubmitted={isSubmitted}
          />
        </div>
      </div>

      <ControlBar
        isMuted={isMuted}
        isVideoHidden={isVideoHidden}
        onMuteToggle={() => setIsMuted(!isMuted)}
        onVideoToggle={() => setIsVideoHidden(!isVideoHidden)}
      />
    </div>
  )
}
