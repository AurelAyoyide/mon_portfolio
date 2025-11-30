'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const locations = [
  {
    coords: [50.9375, 6.9603] as [number, number],
    country: 'Germany',
    isCurrent: true,
    companies: [
      {
        city: 'Cologne',
        company: 'Unicepta',
        period: '2020 - Present',
        role: 'Senior Software Engineer'
      }
    ]
  },
  {
    coords: [41.3275, 19.8187] as [number, number],
    country: 'Albania',
    isCurrent: false,
    companies: [
      {
        city: 'Tirana',
        company: 'Ritech Solutions',
        period: '2018 - 2020',
        role: 'Senior Software Engineer'
      },
      {
        city: 'Tirana',
        company: 'Group of Companies',
        period: '2015 - 2017',
        role: 'Software Engineer'
      }
    ]
  },
  {
    coords: [48.8566, 2.3522] as [number, number],
    country: 'France',
    isCurrent: false,
    companies: [
      {
        city: 'Paris',
        company: 'Gutenberg Technology',
        period: '2017 - 2018',
        role: 'Software Engineer'
      }
    ]
  }
]

export default function JourneyMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initialView = { center: [48.5, 10] as [number, number], zoom: 4 }

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
