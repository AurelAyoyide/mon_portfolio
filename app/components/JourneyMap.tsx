'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const locations = [
  {
    coords: [6.3651, 2.4183] as [number, number], // Epitech Bénin - Boulevard Saint Michel
    country: 'Benin',
    isCurrent: true,
    companies: [
      {
        city: 'Cotonou',
        company: 'Epitech Coding Academy',
        period: '2025',
        role: 'Formation dev web full stack'
      }
    ]
  },
  {
    coords: [6.381667, 2.392222] as [number, number], // Licence - 9C6J+HVV, Ave Proche
    country: 'Benin',
    isCurrent: false,
    companies: [
      {
        city: 'Cotonou',
        company: 'Licence Pro Systèmes Informatiques',
        period: '2019 - 2024',
        role: 'Formation'
      }
    ]
  },
  {
    coords: [6.383611, 2.406111] as [number, number], // Lycée - 9FM4+HFC, Rue 1461
    country: 'Benin',
    isCurrent: false,
    companies: [
      {
        city: 'Cotonou',
        company: 'Technicien Maintenance',
        period: '2015 - 2018',
        role: 'Formation'
      }
    ]
  }
]

export default function JourneyMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initialView = { center: [6.3703, 2.3912] as [number, number], zoom: 12 }

    // Initialize map
    const map = L.map(mapRef.current, {
      center: initialView.center,
      zoom: initialView.zoom,
      scrollWheelZoom: false,
      zoomControl: true
    })

    mapInstanceRef.current = map

    // Use the exact same tile layer as original
    L.tileLayer('https://watercolormaps.collection.cooperhewitt.org/tile/watercolor/{z}/{x}/{y}.jpg', {
      attribution: '© Stamen Design, © OpenStreetMap contributors',
      maxZoom: 16
    }).addTo(map)

    // Add markers for each location
    locations.forEach((location) => {
      const isCurrent = location.isCurrent
      
      const markerIcon = L.divIcon({
        className: isCurrent ? 'neo-marker neo-marker-current' : 'neo-marker',
        html: `
          <div class="neo-marker-label ${isCurrent ? 'neo-marker-label-current' : ''}">${location.country}</div>
          <div class="neo-marker-pin ${isCurrent ? 'neo-marker-pin-current' : ''}"></div>
        `,
        iconSize: isCurrent ? [35, 35] : [30, 30],
        iconAnchor: isCurrent ? [17.5, 50] : [15, 45],
        popupAnchor: [0, isCurrent ? -50 : -45]
      })

      // Build popup content
      let popupContent = `<div class="map-popup">`
      popupContent += `<div class="map-popup-country">${location.country}</div>`

      location.companies.forEach((company, index) => {
        if (index > 0) popupContent += `<div class="map-popup-divider"></div>`
        popupContent += `
          <div class="map-popup-company">
            <strong>${company.company}</strong>
            <span>${company.role}</span>
            <small>${company.city}</small>
            <small>${company.period}</small>
          </div>
        `
      })

      popupContent += `</div>`

      const marker = L.marker(location.coords, { icon: markerIcon }).addTo(map)
      marker.bindPopup(popupContent)
    })

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div 
      ref={mapRef} 
      id="journey-map"
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '400px'
      }} 
    />
  )
}
