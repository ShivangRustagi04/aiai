"use client"

import { useState, useEffect } from "react"
import { useWebSocket } from "@/hooks/use-websocket"
import VideoSection from "./video-section"
import CodeEditor from "./code-editor"

export default function InterviewInterfaceIntegrated() {
  const { isConnected, messages, sendMessage } = useWebSocket("ws://localhost:8765")
  const [selectedLanguage, setSelectedLanguage] = useState("Python")
  const [code, setCode] = useState("")
  const [output, setOutput] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState("")

  useEffect(() => {
    if (isConnected) {
      // Start the interview when connected
      sendMessage({ type: "start_interview" })
    }
  }, [isConnected])

  useEffect(() => {
    // Handle messages from Python backend
    const latestMessage = messages[messages.length - 1]
    if (!latestMessage) return

    switch (latestMessage.type) {
      case "code_result":
        setOutput(latestMessage.output)
        break
      case "solution_evaluated":
        setOutput(latestMessage.evaluation)
        break
      case "ai_response":
        // Handle AI response (could trigger TTS on frontend too)
        console.log("AI Response:", latestMessage.text)
        break
      case "new_question":
        setCurrentQuestion(latestMessage.question)
        break
    }
  }, [messages])

  const handleRunCode = () => {
    sendMessage({
      type: "run_code",
      language: selectedLanguage,
      code: code,
    })
  }

  const handleSubmitSolution = () => {
    sendMessage({
      type: "submit_solution",
      code: code,
      language: selectedLanguage,
    })
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Your existing UI components */}
      <div className="flex-1 flex">
        <VideoSection />
        <CodeEditor
          code={code}
          onChange={setCode}
          onRun={handleRunCode}
          onSubmit={handleSubmitSolution}
          output={output}
        />
      </div>
      <div className="bg-gray-800 p-2">
        <span className={`text-sm ${isConnected ? "text-green-400" : "text-red-400"}`}>
          {isConnected ? "Connected to AI Interviewer" : "Connecting..."}
        </span>
      </div>
    </div>
  )
}
