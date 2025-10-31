"use client"

import { useState, useEffect } from "react"
import { AlertCircle, X, Star } from "lucide-react"
import { getChannelsByCountry } from "@/lib/iptv-channels"
import VideoPlayer from "@/components/video-player"

interface CountryDetailProps {
  country: string
  channel: string
  onBack: () => void
}

export default function CountryDetail({ country, channel, onBack }: CountryDetailProps) {
  const [streamUrl, setStreamUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [isFavorited, setIsFavorited] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    try {
      const favorites = JSON.parse(localStorage.getItem("favorites") || "[]")
      const favoriteKey = `${country}:${channel}`
      setIsFavorited(favorites.includes(favoriteKey))
    } catch (error) {
      console.error("Error loading favorites:", error)
    }
  }, [country, channel, isMounted])

  const toggleFavorite = () => {
    if (!isMounted) return

    try {
      const favoriteKey = `${country}:${channel}`
      const favorites = JSON.parse(localStorage.getItem("favorites") || "[]")

      if (favorites.includes(favoriteKey)) {
        const updated = favorites.filter((fav: string) => fav !== favoriteKey)
        localStorage.setItem("favorites", JSON.stringify(updated))
        setIsFavorited(false)
      } else {
        favorites.push(favoriteKey)
        localStorage.setItem("favorites", JSON.stringify(favorites))
        setIsFavorited(true)
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError("")

    const fetchChannels = async () => {
      try {
        const channels = await getChannelsByCountry(country)
        const selectedChannel = channels.find((c) => c.name === channel)

        if (selectedChannel && selectedChannel.url) {
          const url = selectedChannel.url.trim()
          if (url.startsWith("http://") || url.startsWith("https://")) {
            if (url.includes("youtube.com") || url.includes("youtube-nocookie.com")) {
              setStreamUrl(url)
            } else {
              setStreamUrl(`/api/proxy?url=${encodeURIComponent(url)}`)
            }
          } else {
            setError("Invalid stream URL format. Only HTTP/HTTPS streams are supported.")
          }
        } else {
          setError("Stream not found in database")
        }
      } catch (err) {
        setError("Failed to load stream list")
        console.error("Error loading stream list:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchChannels()
  }, [country, channel])

  return (
    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-lg shadow-2xl overflow-hidden flex items-center justify-center">
      {loading ? (
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
          <div className="text-slate-400">Loading stream...</div>
        </div>
      ) : error ? (
        <div className="text-center px-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <div className="text-red-400 mb-2 font-medium">Stream Error</div>
          <p className="text-sm text-slate-500 max-w-xs">{error}</p>
        </div>
      ) : streamUrl ? (
        <VideoPlayer
          src={streamUrl}
          onError={() => {
            setError("Failed to load video stream. The stream may be offline or unavailable.")
          }}
        />
      ) : (
        <div className="text-center px-4">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <div className="text-slate-400 mb-2 font-medium">Stream Unavailable</div>
          <p className="text-sm text-slate-600 max-w-xs">This channel is not currently available.</p>
        </div>
      )}

      {/* Buttons Overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <button
          onClick={toggleFavorite}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className={`w-5 h-5 transition-all ${isFavorited ? "fill-yellow-400 text-yellow-400" : "text-white"}`}
          />
        </button>
        <button
          onClick={onBack}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          aria-label="Close player"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
