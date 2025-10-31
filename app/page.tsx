"use client"

import { useState, useEffect, useCallback } from "react"
import Header from "@/components/header"
import GlobeViewer from "@/components/globe-viewer"
import CountrySidebar from "@/components/country-sidebar"
import CountryDetail from "@/components/country-detail"

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [countryInfo, setCountryInfo] = useState<string | null>(null)
  const [isInfoLoading, setIsInfoLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchCountryInfo = useCallback(async (countryName: string) => {
    setIsInfoLoading(true)
    setCountryInfo(null)
    try {
      const response = await fetch("/api/country-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country: countryName }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch country information")
      }

      const data = await response.json()
      setCountryInfo(data.info)
    } catch (error) {
      console.error(error)
      setCountryInfo("Sorry, we couldn't fetch information for this country at the moment.")
    } finally {
      setIsInfoLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedCountry) {
      fetchCountryInfo(selectedCountry)
    } else {
      setCountryInfo(null)
    }
  }, [selectedCountry, fetchCountryInfo])

  if (!mounted) return null

  const handleGlobeCountryClick = (countryName: string) => {
    setSelectedChannel(null) // Reset channel when a new country is clicked
    setSelectedCountry(countryName)
    setSidebarOpen(true)
  }

  // When a channel is selected, just update the state
  const handleSelectChannel = (channel: string) => {
    setSelectedChannel(channel)
  }

  // When back is clicked from video player or overlay, clear channel but keep country and sidebar.
  const handleBackFromPlayer = () => {
    setSelectedChannel(null)
  }

  const handleSelectCountry = (country: string | null) => {
    setSelectedChannel(null)
    setSelectedCountry(country)
  }

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white overflow-hidden">
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden relative pt-16">
        {/* Globe Viewer Container */}
        <div className="flex-1 relative min-w-0">
          <GlobeViewer selectedCountry={selectedCountry} onCountryClick={handleGlobeCountryClick} />

          {/* Video Player Overlay */}
          {selectedCountry && selectedChannel && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-label="Video Player"
            >
              <CountryDetail country={selectedCountry} channel={selectedChannel} onBack={handleBackFromPlayer} />
            </div>
          )}
        </div>

        {/* Country Sidebar - Responsive */}
        <div
          className={`fixed lg:static inset-y-0 right-0 z-40 w-full sm:w-96 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          }`}
          role="complementary"
          aria-label="Country and channel selection"
        >
          <CountrySidebar
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry}
            onSelectChannel={handleSelectChannel}
            onClose={() => setSidebarOpen(false)}
            countryInfo={countryInfo}
            isInfoLoading={isInfoLoading}
          />
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            role="presentation"
            aria-hidden="true"
          />
        )}
      </main>
    </div>
  )
}
