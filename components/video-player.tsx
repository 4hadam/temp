"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, Settings } from "lucide-react"

interface VideoPlayerProps {
  src: string
  poster?: string
  autoPlay?: boolean
  muted?: boolean
  isLive?: boolean
  fit?: "contain" | "cover"
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = true,
  muted = false,
  isLive = true,
  fit = "contain",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<any>(null)
  const [playing, setPlaying] = useState(autoPlay)
  const [volume, setVolume] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [quality, setQuality] = useState("Auto")
  const [availableQualities, setAvailableQualities] = useState<string[]>([])
  const [showQualityMenu, setShowQualityMenu] = useState(false)

  // 🧩 تحميل إعدادات الصوت من LocalStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem("player-volume")
    const savedMuted = localStorage.getItem("player-muted")
    if (savedVolume) setVolume(parseFloat(savedVolume))
    if (savedMuted === "true" && videoRef.current)
      videoRef.current.muted = true
  }, [])

  // 🧩 حفظ الصوت تلقائيًا في LocalStorage
  useEffect(() => {
    localStorage.setItem("player-volume", volume.toString())
    localStorage.setItem("player-muted", (volume === 0).toString())
  }, [volume])

  // 💬 Stream Offline بعد 10 ثوانٍ
  useEffect(() => {
    if (loaded) return
    const timer = setTimeout(() => {
      if (!loaded) {
        setError(true)
        setLoading(false)
      }
    }, 10000)
    return () => clearTimeout(timer)
  }, [loaded])

  // 🎥 HLS
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setLoading(true)
    setLoaded(false)
    setError(false)

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    import("hls.js").then((HlsModule) => {
      const Hls = HlsModule.default
      const streamUrl = src.startsWith("/api/proxy")
        ? decodeURIComponent(src.split("url=")[1] || "")
        : src

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 8,
          liveSyncDuration: 3,
        })
        hlsRef.current = hls
        hls.loadSource(streamUrl)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          if (data?.levels?.length) {
            const qualities = data.levels.map((l: any) => `${l.height}p`)
            setAvailableQualities(["Auto", ...qualities])
            setQuality("Auto")
          }
          video.play().catch(() => {
            video.muted = true
            video.play().catch(() => setPlaying(false))
          })
        })

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const level = hls.levels[data.level]
          if (level && level.height) setQuality(`${level.height}p`)
          else setQuality("Auto")
        })

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn("Network error – retrying stream...")
                hls.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn("Media error – recovering...")
                hls.recoverMediaError()
                break
              default:
                setError(true)
                setLoading(false)
                hls.destroy()
                break
            }
          }
        })

        video.addEventListener("playing", () => {
          setLoading(false)
          setLoaded(true)
        })
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl
        video.addEventListener("loadedmetadata", () => {
          video.play().then(() => setLoaded(true))
        })
      }
    })

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src])

  // ⚙️ التحكمات
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }

  const toggleMute = () => {
    const newVolume = volume === 0 ? 1 : 0
    setVolume(newVolume)
    if (videoRef.current) videoRef.current.muted = newVolume === 0
  }

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement
    if (!container) return
    if (!document.fullscreenElement) {
      container.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const retryStream = () => {
    setError(false)
    setLoading(true)
    setLoaded(false)
    if (videoRef.current) videoRef.current.load()
  }

  // 🪄 تغيير الجودة يدويًا بدون تجميد
  const handleQualityChange = (q: string) => {
    if (!hlsRef.current) return
    const hls = hlsRef.current

    if (q === "Auto") {
      hls.currentLevel = -1 // Auto
      setQuality("Auto")
      return
    }

    const index = hls.levels.findIndex((l: any) => `${l.height}p` === q)
    if (index !== -1) {
      hls.currentLevel = index // يغير الجودة فورًا
      setQuality(q)
    }
    setShowQualityMenu(false)
  }

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden group select-none">
      {/* 🎬 الفيديو */}
      <video
        ref={videoRef}
        poster={poster}
        className={`w-[130%] h-[130%] object-${fit} transform scale-110 translate-x-[-10%] translate-y-[-5%] transition-all duration-700 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        playsInline
        muted={volume === 0}
        controls={false}
        autoPlay={autoPlay}
      />

      {/* ⏳ التحميل / الخطأ */}
      {!error ? (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center bg-black text-gray-300 z-10 transition-opacity duration-700 ${
            loaded ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-cyan-400 border-t-transparent mb-4"></div>
          <span className="text-sm font-medium">Loading stream...</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-gray-300 z-10">
          <span className="text-lg font-semibold mb-4 text-red-500">Stream Offline</span>
          <button
            onClick={retryStream}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
          >
            <RotateCcw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* 🎛 التحكمات */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-black/40 backdrop-blur-sm text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="hover:scale-110 transition-transform">
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button onClick={toggleMute} className="hover:scale-110 transition-transform">
            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {isLive && (
            <div className="flex items-center gap-1 ml-2">
              <span className="bg-red-600 rounded-full w-2 h-2 animate-pulse"></span>
              <span className="uppercase font-semibold text-xs tracking-widest">LIVE</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => setShowQualityMenu((v) => !v)}
            className="hover:scale-110 transition-transform flex items-center gap-1"
          >
            <Settings size={18} />
            <span className="text-xs">{quality}</span>
          </button>

          {/* قائمة الجودة */}
          {showQualityMenu && (
            <div className="absolute bottom-8 right-0 bg-black/80 text-white rounded-md shadow-md p-2 flex flex-col gap-1 text-xs">
              {availableQualities.map((q) => (
                <button
                  key={q}
                  onClick={() => handleQualityChange(q)}
                  className={`px-2 py-1 rounded hover:bg-gray-700 ${
                    q === quality ? "text-cyan-400 font-semibold" : ""
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <button onClick={toggleFullscreen} className="hover:scale-110 transition-transform">
            {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
