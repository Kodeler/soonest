"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RankedResult } from "@/lib/types";

interface Props {
  results: RankedResult[];
  center: { lat: number; lng: number };
  onSelect: (id: string) => void;
}

export default function MapView({ results, center, onSelect }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [noToken, setNoToken] = useState(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !mapContainer.current) {
      setNoToken(true);
      return;
    }

    let cancelled = false;

    import("mapbox-gl").then((mapboxgl) => {
      if (cancelled || !mapContainer.current) return;

      mapboxgl.default.accessToken = token;
      const map = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [center.lng, center.lat],
        zoom: 12,
      });

      mapRef.current = map;

      map.on("load", () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        results.forEach((r, i) => {
          const el = document.createElement("div");
          el.className = "map-marker";
          el.style.cssText = `
            width: 28px; height: 28px; border-radius: 50%;
            background: ${i === 0 ? "#e94560" : "#1a1a2e"};
            color: white; display: flex; align-items: center;
            justify-content: center; font-size: 11px; font-weight: 700;
            cursor: pointer; border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          `;
          el.textContent = String(i + 1);
          el.addEventListener("click", () => onSelect(r.id));

          const marker = new mapboxgl.default.Marker(el)
            .setLngLat([r.lng, r.lat])
            .addTo(map);

          markersRef.current.push(marker);
        });
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
    };
  }, [results, center, onSelect]);

  if (noToken) {
    return (
      <div className="h-full flex items-center justify-center bg-stone-100 text-stone-400 text-sm p-8 text-center">
        <div>
          <p className="font-medium">Map unavailable</p>
          <p className="mt-1 text-xs">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to .env to enable the map view
          </p>
        </div>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full sticky top-0" style={{ height: "calc(100vh - 140px)" }} />;
}
