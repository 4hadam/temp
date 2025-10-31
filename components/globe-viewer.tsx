"use client"

import { useEffect, useRef, useCallback } from "react"
import * as THREE from "three"
import type { GlobeInstance } from "globe.gl"

interface GlobeViewerProps {
  selectedCountry: string | null
  onCountryClick?: (countryName: string) => void
}

export default function GlobeViewer({ selectedCountry, onCountryClick }: GlobeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<GlobeInstance | null>(null)
  const hoveredPolygonRef = useRef<any>(null)
  const polygonsDataRef = useRef<any>(null)
  const starsRef = useRef<THREE.Group | null>(null)

  const getPolygonColor = useCallback(
    (d: any) => {
      const countryName = d?.properties?.ADMIN || ""
      if (countryName === selectedCountry) return "rgba(0, 255, 255, 0.8)"
      if (d === hoveredPolygonRef.current) return "rgba(255, 255, 255, 0.7)"
      const hash = countryName.split("").reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0)
      const hue = (hash * 137.5) % 360
      return `hsla(${hue}, 70%, 50%, 0.9)`
    },
    [selectedCountry],
  )

  useEffect(() => {
    let aborted = false
    const aborter = new AbortController()

    const initGlobe = async () => {
      if (!containerRef.current) return

      const GlobeFactory = (await import("globe.gl")).default
      const globe = GlobeFactory()(containerRef.current)
        .globeImageUrl(
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        )
        .showAtmosphere(true)
        .atmosphereColor("#33aaff")
        .atmosphereAltitude(0.25)
        .polygonSideColor(() => "rgba(100, 100, 100, 0.15)")
        .polygonStrokeColor(() => "rgba(200, 200, 200, 0.25)")

      globeRef.current = globe

      const setSize = () => {
        if (containerRef.current && globeRef.current) {
          globeRef.current
            .width(containerRef.current.clientWidth)
            .height(containerRef.current.clientHeight)
        }
      }
      setSize()
      window.addEventListener("resize", setSize)

      const controls = globe.controls()
      controls.autoRotate = false
      controls.enableZoom = true

      // 🌌 خلفية نجوم كبيرة متوهجة مثل tv.garden
      const scene = globe.scene()
      const starGroup = new THREE.Group()

      const createStars = (count: number, color: number, size: number, spread: number, opacity: number) => {
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(count * 3)
        for (let i = 0; i < count * 3; i++) {
          positions[i] = (Math.random() - 0.5) * spread
        }
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

        const material = new THREE.PointsMaterial({
          color,
          size,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })

        const stars = new THREE.Points(geometry, material)
        starGroup.add(stars)
      }

      // ثلاث طبقات بعمق وألوان مختلفة
      createStars(2000, 0xffffff, 2.2, 6000, 0.9) // نجوم بيضاء كبيرة وواضحة
      createStars(1000, 0x88ccff, 2.8, 7000, 0.8) // نجوم سماوية أكثر سطوعًا
      createStars(600, 0xffe0b2, 3.2, 8000, 0.7)  // نجوم ذهبية باهتة تضيف عمق

      scene.add(starGroup)
      starsRef.current = starGroup

      // حركة دوران بطيئة جدًا لإحساس العمق
      const animateStars = () => {
        if (starsRef.current) {
          starsRef.current.rotation.y += 0.0001
          starsRef.current.rotation.x += 0.00003
        }
        requestAnimationFrame(animateStars)
      }
      animateStars()

      // تحميل بيانات الدول
      try {
        const response = await fetch(
          "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson",
          { signal: aborter.signal },
        )
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const geojsonData = await response.json()
        if (aborted) return

        polygonsDataRef.current = geojsonData.features

        globe
          .polygonsData(geojsonData.features)
          .polygonGeoJsonGeometry((d: any) => d.geometry)
          .polygonCapColor(getPolygonColor)
          .polygonLabel((d: any) => d.properties?.ADMIN || "")
          .onPolygonHover((hoverD: any) => {
            hoveredPolygonRef.current = hoverD
            globeRef.current?.polygonCapColor(getPolygonColor)
          })
          .onPolygonClick((clickedD: any) => {
            const countryName = clickedD?.properties?.ADMIN || ""
            if (countryName && onCountryClick) onCountryClick(countryName)
          })
      } catch (err) {
        if (!aborted) console.error("Error loading countries data:", err)
      }

      return () => {
        window.removeEventListener("resize", setSize)
      }
    }

    const cleanup = initGlobe()

    return () => {
      aborted = true
      aborter.abort()
      const controls = globeRef.current?.controls?.()
      if (controls) controls.autoRotate = false
      if (starsRef.current) {
        globeRef.current?.scene().remove(starsRef.current)
        starsRef.current.children.forEach((c: any) => {
          c.geometry.dispose()
          c.material.dispose()
        })
      }
      cleanup?.then?.((fn) => typeof fn === "function" && fn())
    }
  }, [])

  useEffect(() => {
    if (globeRef.current && polygonsDataRef.current) {
      globeRef.current.polygonCapColor(getPolygonColor)
    }
  }, [selectedCountry, getPolygonColor])

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gradient-to-b from-[#02051A] to-[#000000]"
      aria-label="Interactive globe viewer"
    />
  )
}
