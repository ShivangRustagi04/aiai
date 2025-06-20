"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CodeEditorProps {
  code: string
  language: string
  onChange: (value: string) => void
  onRun: () => void
  onSubmit: () => void
  output: string
  isSubmitted: boolean
  question: string
  hideOutput?: boolean
  compact?: boolean
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
}: CodeEditorProps) {
  const [selectedLang, setSelectedLang] = useState(language)

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const lineCount = code.split("\n").length
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  return (
    <div className="h-full w-full grid grid-cols-3 bg-gray-900 text-white">
      {/* Question Panel */}
      <div className="border-r border-gray-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-2 text-yellow-400">Question</h2>
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
          {question || "Loading..."}
        </p>
      </div>

      {/* Code Editor Panel */}
      <div className="flex flex-col border-r border-gray-800">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-purple-300">Code Editor</h2>
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-10 bg-gray-900 text-gray-500 text-right pr-2 py-2 select-none border-r border-gray-800 overflow-y-auto text-xs">
            {lineNumbers.map((lineNum) => (
              <div key={lineNum} className="leading-6">
                {lineNum}
              </div>
            ))}
          </div>
          <textarea
            value={code}
            onChange={handleCodeChange}
            className="flex-1 bg-gray-900 text-gray-100 p-3 font-mono text-sm outline-none resize-none leading-6"
            spellCheck={false}
            placeholder={`Write your ${selectedLang.toUpperCase()} code here...`}
            style={{ tabSize: 4 }}
          />
        </div>

        <div className="p-4 border-t border-gray-700 flex space-x-3">
          <Button onClick={onRun} className="bg-green-600 hover:bg-green-700">
            Run Code
          </Button>
          <Button
            onClick={onSubmit}
            className={`bg-purple-600 hover:bg-purple-700 text-white ${
              isSubmitted ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitted}
          >
            {isSubmitted ? "Submitted" : "Submit Solution"}
          </Button>
        </div>
      </div>

      {/* Output Panel */}
      <div className="p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-2 text-green-400">Output</h2>
        <pre className="bg-black/50 text-green-400 p-3 rounded border border-green-500/30 text-sm h-[calc(100%-3rem)] overflow-y-auto whitespace-pre-wrap font-mono">
          {output || "Run your code to see output..."}
        </pre>
      </div>
    </div>
  )
}
