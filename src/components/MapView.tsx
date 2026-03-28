'use client';

import React, { useEffect, useRef } from 'react';
import type { LocationMarker } from '@/types';

interface MapViewProps {
  locations: LocationMarker[];
}

/**
 * OpenStreetMap view using Leaflet.
 * Dynamically loaded to avoid SSR issues.
 */
export function MapView({ locations }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;

    // Dynamically import Leaflet (client-only)
    const loadMap = async () => {
      const L = await import('leaflet');

      // Import leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Fix default icon paths for Leaflet in Next.js
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      // Destroy previous map if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Create map
      const map = L.map(mapRef.current!, {
        attributionControl: true,
      });

      // Use dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add markers
      const markers = locations.map((loc) => {
        const marker = L.marker([loc.latitude, loc.longitude]).addTo(map);
        marker.bindPopup(
          `<strong>${loc.name}</strong><br/>${loc.type}${loc.address ? `<br/><small>${loc.address}</small>` : ''}`
        );
        return marker;
      });

      // Fit bounds
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.3));
      }

      mapInstanceRef.current = map;
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations]);

  if (locations.length === 0) return null;

  return (
    <div className="map-section" aria-label="Relevant locations map">
      <h3 className="map-title">📍 Relevant Locations</h3>
      <div
        ref={mapRef}
        className="map-container"
        role="img"
        aria-label={`Map showing ${locations.length} location${locations.length === 1 ? '' : 's'}`}
      />

      {/* Accessible list fallback for screen readers */}
      <ul className="map-locations-list" aria-label="Location details">
        {locations.map((loc, i) => (
          <li key={i} className="map-location-item">
            <span className="map-location-pin" aria-hidden="true">📍</span>
            <div>
              <span className="map-location-name">{loc.name}</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                {' '}— {loc.type}
              </span>
              {loc.address && (
                <div className="map-location-address">{loc.address}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
