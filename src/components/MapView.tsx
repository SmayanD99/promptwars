'use client';

import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { LocationMarker } from '@/types';

interface MapViewProps {
  locations: LocationMarker[];
}

/**
 * Google Maps view using the official JS API Loader.
 * Falls back to a location list if the API key is missing.
 */
export function MapView({ locations }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      // No API key — skip map rendering, list fallback is shown below
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
    });

    let isMounted = true;

    loader.importLibrary('maps').then((mapsLib) => {
      if (!isMounted || !mapRef.current) return;

      // Clean up previous map
      if (mapInstanceRef.current) {
        mapRef.current.innerHTML = '';
      }

      const { Map } = mapsLib as typeof google.maps;

      // Calculate center from locations
      const avgLat = locations.reduce((sum, l) => sum + l.latitude, 0) / locations.length;
      const avgLng = locations.reduce((sum, l) => sum + l.longitude, 0) / locations.length;

      const map = new Map(mapRef.current!, {
        center: { lat: avgLat, lng: avgLng },
        zoom: locations.length === 1 ? 14 : 10,
        mapId: 'bridgeai-dark-map',
        // Dark theme styling
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1a2035' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a2035' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
          {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#c4b5fd' }],
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#64748b' }],
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#1a2e1a' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#2a3555' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1a2035' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#3a4575' }],
          },
          {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{ color: '#2a3555' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0e1525' }],
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#4a5568' }],
          },
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Add markers
      const bounds = new google.maps.LatLngBounds();

      locations.forEach((loc) => {
        const position = { lat: loc.latitude, lng: loc.longitude };
        bounds.extend(position);

        const marker = new google.maps.Marker({
          position,
          map,
          title: loc.name,
          animation: google.maps.Animation.DROP,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="color:#1a2035;padding:4px 0;">
              <strong style="font-size:14px;">${loc.name}</strong><br/>
              <span style="color:#64748b;font-size:12px;">${loc.type}</span>
              ${loc.address ? `<br/><span style="color:#94a3b8;font-size:11px;">${loc.address}</span>` : ''}
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });

      // Fit bounds if multiple markers
      if (locations.length > 1) {
        map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });
      }

      mapInstanceRef.current = map;
    }).catch((err) => {
      console.error('Failed to load Google Maps:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [locations]);

  if (locations.length === 0) return null;

  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="map-section" aria-label="Relevant locations map">
      <h3 className="map-title">📍 Relevant Locations</h3>

      {hasApiKey && (
        <div
          ref={mapRef}
          className="map-container"
          role="img"
          aria-label={`Map showing ${locations.length} location${locations.length === 1 ? '' : 's'}`}
        />
      )}

      {/* Accessible list (always shown as fallback / screen reader support) */}
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
