"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, X } from "lucide-react"
import { getChannelsByCountry } from "@/lib/iptv-channels"
import { COUNTRY_CODE_MAP } from "@/lib/country-codes"
import type { IPTVChannel } from "@/lib/iptv-channels"
import { Skeleton } from "@/components/ui/skeleton"

interface CountrySidebarProps {
  selectedCountry: string | null
  onSelectCountry: (country: string | null) => void
  onSelectChannel: (channel: string) => void
  onClose?: () => void
  countryInfo: string | null
  isInfoLoading: boolean
}

const COUNTRIES = Object.keys(COUNTRY_CODE_MAP)

export default function CountrySidebar({
  selectedCountry,
  onSelectCountry,
  onSelectChannel,
  onClose,
  countryInfo,
  isInfoLoading,
}: CountrySidebarProps) {
  const [channels, setChannels] = useState<IPTVChannel[]>([])
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const updateTime = () =>
      setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const filteredCountries = useMemo(
    () => COUNTRIES.filter((c) => c.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  )

  useEffect(() => {
    if (selectedCountry) {
      setLoadingChannels(true)
      const fetchChannels = async () => {
        try {
          const data = await getChannelsByCountry(selectedCountry)
          setChannels(data)
        } catch {
          setChannels([])
        } finally {
          setLoadingChannels(false)
        }
      }
      fetchChannels()
    }
  }, [selectedCountry])

  const handleSelectCountry = (country: string) => onSelectCountry(country)
  const handleSelectChannel = (channel: IPTVChannel) => {
    onSelectChannel(channel.name)
    onClose?.()
  }

  const handleBack = () => onSelectCountry(null)
  const showingChannels = !!selectedCountry

  return (
    <aside className="w-full h-full bg-[#1c1d21] text-white flex flex-col border-l border-slate-800">
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {showingChannels && (
            <button
              onClick={handleBack}
              className="p-1.5 rounded-full bg-[#7fff50] hover:bg-[#6ee047] text-black transition"
              aria-label="Return to country list"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-semibold text-cyan-400 leading-tight">
              {selectedCountry || "Select a Country"}
            </h2>
            <p className="text-sm text-slate-400">
              {selectedCountry ? "Cairo" : "Choose a channel"}
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-400">{currentTime}</p>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {!showingChannels ? (
          <ul className="virtualized-list">
            {filteredCountries.map((country, index) => {
              const code = COUNTRY_CODE_MAP[country]?.toLowerCase()
              return (
                <li
                  key={country}
                  className="sidebar-entry country-item"
                  data-country-code={code?.toUpperCase()}
                  data-index={index}
                  style={{ height: "64px" }}
                >
                  <button
                    onClick={() => handleSelectCountry(country)}
                    className="flex items-center gap-3 w-full h-full px-5 hover:bg-[#2a2b31] transition-colors text-left"
                  >
                    <img
                      src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${code}.svg`}
                      alt={`${country} flag`}
                      className="w-7 h-5 rounded-sm object-cover flex-shrink-0"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                    <span className="text-[15px] font-medium text-white truncate">
                      {country}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <>
            <div className="px-5 py-3">
              {isInfoLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-11/12 bg-slate-800" />
                  <Skeleton className="h-4 w-5/6 bg-slate-800" />
                </div>
              ) : countryInfo ? (
                <p className="text-sm text-slate-300">{countryInfo}</p>
              ) : (
                <p className="text-sm text-slate-500">
                  Sorry, we couldn’t fetch information for this country.
                </p>
              )}
            </div>

            {loadingChannels ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">Loading streams...</div>
            ) : channels.length > 0 ? (
              <ul className="virtualized-list">
                {channels.map((channel, index) => (
                  <li
                    key={channel.name}
                    className="sidebar-entry channel-item"
                    data-index={index}
                    style={{ height: "60px" }}
                  >
                    <button
                      onClick={() => handleSelectChannel(channel)}
                      className="flex items-center justify-between w-full h-full px-5 hover:bg-[#2a2b31] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${
                            COUNTRY_CODE_MAP[selectedCountry!]?.toLowerCase() || "xx"
                          }.svg`}
                          alt="flag"
                          className="w-6 h-4 rounded-sm object-cover"
                          onError={(e) =>
                            ((e.target as HTMLImageElement).style.display = "none")
                          }
                        />
                        <span className="text-[15px] text-white truncate font-normal">
                          {channel.name}
                        </span>
                      </div>
                      {channel.language && (
                        <span className="text-xs text-slate-400 uppercase ml-2">
                          {channel.language}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                No streams available for {selectedCountry}
              </div>
            )}
          </>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400 text-center">
        {showingChannels
          ? `${channels.length} stream${channels.length !== 1 ? "s" : ""} available`
          : `${filteredCountries.length} countr${filteredCountries.length !== 1 ? "ies" : "y"} available`}
      </div>
    </aside>
  )
}
