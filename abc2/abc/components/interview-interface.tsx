"use client"

import { useState, useEffect, useRef } from "react"
import VideoSection from "./video-section"
import CodeEditor from "./code-editor"
import ControlBar from "./control-bar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// Define SpeechRecognition interface
declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

interface InterviewPhase {
  phase: "greeting" | "introduction" | "technical" | "coding" | "conclusion"
  questionCount: number
  currentQuestion: string
  waitingForResponse: boolean
}

export default function InterviewInterface() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoHidden, setIsVideoHidden] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("python")
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [output, setOutput] = useState<string>("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentAIMessage, setCurrentAIMessage] = useState("")
  const [userTechnologies, setUserTechnologies] = useState<string[]>([])
  const [codingQuestionsAsked, setCodingQuestionsAsked] = useState(0)

  const [interviewPhase, setInterviewPhase] = useState<InterviewPhase>({
    phase: "greeting",
    questionCount: 0,
    currentQuestion: "",
    waitingForResponse: false,
  })

  const [code, setCode] = useState({
    python: "",
    java: "",
    cpp: "",
    c: "",
    javascript: "",
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onstart = () => {
        setIsListening(true)
      }

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        console.log("User said:", transcript)
        handleUserResponse(transcript)
      }

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Start interview
  const startInterview = () => {
    setInterviewStarted(true)
    setOutput("Interview started! AI interviewer will begin shortly...")

    // Start with greeting
    setTimeout(() => {
      speakAndWait("Hello! Welcome to your technical interview. How are you doing today?", () => {
        setInterviewPhase({
          phase: "greeting",
          questionCount: 0,
          currentQuestion: "How are you doing today?",
          waitingForResponse: true,
        })
        startListening()
      })
    }, 1000)
  }

  // Handle user responses
  const handleUserResponse = (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase()

    switch (interviewPhase.phase) {
      case "greeting":
        handleGreetingResponse(lowerTranscript)
        break
      case "introduction":
        handleIntroductionResponse(transcript)
        break
      case "technical":
        handleTechnicalResponse(transcript)
        break
      case "coding":
        handleCodingResponse(transcript)
        break
    }
  }

  const handleGreetingResponse = (response: string) => {
    // Move to introduction phase
    setTimeout(() => {
      speakAndWait("That's great to hear! Could you please tell me your name and a bit about yourself?", () => {
        setInterviewPhase({
          phase: "introduction",
          questionCount: 0,
          currentQuestion: "Tell me your name and about yourself",
          waitingForResponse: true,
        })
        startListening()
      })
    }, 1000)
  }

  const handleIntroductionResponse = (response: string) => {
    // Extract potential technologies mentioned
    const techKeywords = [
      "python",
      "java",
      "javascript",
      "react",
      "node",
      "angular",
      "vue",
      "django",
      "flask",
      "spring",
      "mongodb",
      "mysql",
      "postgresql",
      "aws",
      "docker",
      "kubernetes",
    ]

    const mentionedTechs = techKeywords.filter((tech) => response.toLowerCase().includes(tech))
    setUserTechnologies(mentionedTechs)

    // Move to technical questions
    setTimeout(() => {
      speakAndWait(
        "Thank you for the introduction! Now let's dive into some technical questions. What programming languages are you most comfortable with?",
        () => {
          setInterviewPhase({
            phase: "technical",
            questionCount: 1,
            currentQuestion: "What programming languages are you most comfortable with?",
            waitingForResponse: true,
          })
          startListening()
        },
      )
    }, 1000)
  }

  const handleTechnicalResponse = (response: string) => {
    const currentCount = interviewPhase.questionCount

    if (currentCount < 5) {
      // Generate follow-up technical questions
      const questions = [
        "Can you explain the difference between synchronous and asynchronous programming?",
        "What is your experience with databases? Which ones have you worked with?",
        "How do you handle error handling in your applications?",
        "Can you describe a challenging project you've worked on recently?",
        "What development tools and frameworks do you prefer and why?",
      ]

      const nextQuestion = questions[currentCount - 1] || questions[0]

      setTimeout(() => {
        speakAndWait(nextQuestion, () => {
          setInterviewPhase({
            phase: "technical",
            questionCount: currentCount + 1,
            currentQuestion: nextQuestion,
            waitingForResponse: true,
          })
          startListening()
        })
      }, 1000)
    } else {
      // Move to coding questions
      setTimeout(() => {
        askCodingQuestion()
      }, 1000)
    }
  }

  const askCodingQuestion = () => {
    const codingQuestions = [
      {
        question: "Write a function to find the two numbers in an array that add up to a target sum.",
        description: `Problem: Two Sum
        
Given an array of integers and a target sum, return the indices of the two numbers that add up to the target.

Example: 
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1] (because nums[0] + nums[1] = 2 + 7 = 9)

Please write your solution in the code editor.`,
      },
      {
        question: "Write a function to reverse a string without using built-in reverse methods.",
        description: `Problem: Reverse String

Write a function that takes a string as input and returns the string reversed.

Example:
Input: "hello"
Output: "olleh"

Please implement this without using built-in reverse methods.`,
      },
    ]

    const questionIndex = codingQuestionsAsked
    const question = codingQuestions[questionIndex]

    if (question) {
      setCurrentQuestion(question.description)
      setCodingQuestionsAsked(codingQuestionsAsked + 1)

      speakAndWait(
        `Now let's move to a coding challenge. ${question.question} Please check the code editor for the full problem description.`,
        () => {
          setInterviewPhase({
            phase: "coding",
            questionCount: 0,
            currentQuestion: question.question,
            waitingForResponse: false,
          })
        },
      )
    } else {
      // End interview
      setTimeout(() => {
        speakAndWait(
          "Thank you for completing the interview! It was great talking with you. We'll be in touch soon with the results.",
          () => {
            setInterviewPhase({
              phase: "conclusion",
              questionCount: 0,
              currentQuestion: "",
              waitingForResponse: false,
            })
          },
        )
      }, 1000)
    }
  }

  const handleCodingResponse = (response: string) => {
    if (response.toLowerCase().includes("done") || response.toLowerCase().includes("finished")) {
      if (codingQuestionsAsked < 2) {
        setTimeout(() => {
          askCodingQuestion()
        }, 1000)
      } else {
        // End interview
        setTimeout(() => {
          speakAndWait(
            "Excellent work on the coding challenges! Thank you for your time today. It was a pleasure interviewing you.",
            () => {
              setInterviewPhase({
                phase: "conclusion",
                questionCount: 0,
                currentQuestion: "",
                waitingForResponse: false,
              })
            },
          )
        }, 1000)
      }
    }
  }

  // Speech synthesis function
  const speakAndWait = (text: string, callback?: () => void) => {
    setIsAISpeaking(true)
    setCurrentAIMessage(text)

    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onend = () => {
        setIsAISpeaking(false)
        setCurrentAIMessage("")
        if (callback) callback()
      }

      speechSynthesis.speak(utterance)
      speechSynthesisRef.current = utterance
    } else {
      // Fallback: simulate speech duration
      setTimeout(() => {
        setIsAISpeaking(false)
        setCurrentAIMessage("")
        if (callback) callback()
      }, text.length * 80)
    }
  }

  // Start listening function
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error("Error starting speech recognition:", error)
      }
    }
  }

  const handleCodeChange = (value: string) => {
    setCode({
      ...code,
      [selectedLanguage]: value,
    })
  }

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value)
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  const handleVideoToggle = () => {
    setIsVideoHidden(!isVideoHidden)
  }

  const handleRunCode = () => {
    setOutput(
      `Executing ${selectedLanguage} code...\n\n${simulateExecution(selectedLanguage, code[selectedLanguage as keyof typeof code])}`,
    )
  }

  const handleSubmitSolution = () => {
    setOutput("Solution submitted for evaluation...")
    setIsSubmitted(true)

    setTimeout(() => {
      setOutput(
        "Evaluation: Your solution looks good! The approach is correct and the implementation is clean. Well done!",
      )

      // AI speaks the evaluation
      speakAndWait("Great job on the solution! Your approach is correct and well implemented.", () => {
        if (codingQuestionsAsked < 2) {
          setTimeout(() => {
            speakAndWait("Let's move to the next coding challenge.", () => {
              askCodingQuestion()
            })
          }, 2000)
        } else {
          setTimeout(() => {
            speakAndWait(
              "Excellent work! You've completed all the coding challenges. Thank you for your time today.",
              () => {
                setInterviewPhase({
                  phase: "conclusion",
                  questionCount: 0,
                  currentQuestion: "",
                  waitingForResponse: false,
                })
              },
            )
          }, 2000)
        }
      })
    }, 3000)
  }

  const simulateExecution = (language: string, code: string) => {
    if (!code.trim()) return "No code to execute"

    if (code.includes("Hello World")) {
      return "Hello World"
    } else if (language === "python" && code.includes("print")) {
      return code.split("print(")[1]?.split(")")[0]?.replace(/"/g, "").replace(/'/g, "") || "Output"
    } else if (language === "java" && code.includes("System.out.println")) {
      return code.split("System.out.println(")[1]?.split(")")[0]?.replace(/"/g, "").replace(/'/g, "") || "Output"
    }
    return "Code executed successfully"
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <header className="bg-slate-800/90 backdrop-blur-sm p-4 flex justify-between items-center border-b border-slate-700/50 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
          </div>
          <div className="h-6 w-px bg-slate-600"></div>
          <h1 className="text-lg font-semibold text-white">Technical Interview - AI Interviewer</h1>
        </div>
        <div className="flex items-center space-x-4">
          {!interviewStarted ? (
            <Button onClick={startInterview} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
              Start Interview
            </Button>
          ) : (
            <div className="flex items-center space-x-3">
              <div
                className={`px-3 py-1.5 rounded-lg border ${
                  isAISpeaking
                    ? "bg-green-600/20 border-green-500/30 text-green-300"
                    : isListening
                      ? "bg-blue-600/20 border-blue-500/30 text-blue-300"
                      : "bg-slate-600/20 border-slate-500/30 text-slate-300"
                }`}
              >
                <span className="text-sm font-medium">
                  {isAISpeaking ? "AI Speaking" : isListening ? "Listening" : "Ready"}
                </span>
              </div>
              <div className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                <span className="text-sm text-purple-300 font-medium capitalize">{interviewPhase.phase} Phase</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <VideoSection
          isVideoHidden={isVideoHidden}
          isMuted={isMuted}
          isAISpeaking={isAISpeaking}
          isListening={isListening}
          currentAIMessage={currentAIMessage}
        />

        <div className="flex-1 flex flex-col bg-slate-900/50">
          <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-6 py-3 flex items-center shadow-sm">
            <span className="mr-3 text-sm font-medium text-slate-300">Language:</span>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40 h-9 text-sm bg-slate-700/80 border-slate-600/50 hover:bg-slate-700 transition-colors">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentQuestion && (
            <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 p-4">
              <h3 className="font-medium mb-2 text-slate-300">Coding Challenge:</h3>
              <div className="bg-slate-900/50 p-3 rounded-md text-sm whitespace-pre-wrap text-slate-200 border border-slate-700/50">
                {currentQuestion}
              </div>
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
        onMuteToggle={handleMuteToggle}
        onVideoToggle={handleVideoToggle}
      />
    </div>
  )
}
