"use client"

import { Mic, MicOff, Video, VideoOff, Share2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ControlBarProps {
  isMuted: boolean
  isVideoHidden: boolean
  onMuteToggle: () => void
  onVideoToggle: () => void
}

export default function ControlBar({ isMuted, isVideoHidden, onMuteToggle, onVideoToggle }: ControlBarProps) {
  return (
    <div className="bg-gray-800 border-t border-gray-700 p-3 flex justify-between items-center">
      <div className="flex-1">
        <div className="text-sm text-gray-400">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
          Interview in progress
        </div>
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={onMuteToggle}
          variant="ghost"
          size="icon"
          className={`rounded-full ${isMuted ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>

        <Button
          onClick={onVideoToggle}
          variant="ghost"
          size="icon"
          className={`rounded-full ${isVideoHidden ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          {isVideoHidden ? <VideoOff size={20} /> : <Video size={20} />}
        </Button>

        <Button variant="ghost" size="icon" className="rounded-full bg-gray-700 hover:bg-gray-600">
          <Share2 size={20} />
        </Button>
      </div>

      <div className="flex-1 flex justify-end">
        <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
          <X size={16} className="mr-1" />
          End Call
        </Button>
      </div>
    </div>
  )
}
