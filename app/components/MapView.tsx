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

      // Container height settles after flex layout; without this the canvas
      // keeps whatever size it measured at init and renders a partial map.
      // Re-centering is required too — resize from a degenerate size drifts
      // the viewport.
      let settled = false;
      const ro = new ResizeObserver(() => {
        map.resize();
        if (!settled) {
          map.jumpTo({ center: [center.lng, center.lat], zoom: 12 });
          settled = true;
        }
      });
      ro.observe(mapContainer.current);
      map.once("remove", () => ro.disconnect());

      map.on("load", () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        results.forEach((r, i) => {
          const el = document.createElement("div");
          el.className = "map-marker";
          el.style.cssText = `
            width: ${i === 0 ? "34px" : "28px"}; height: ${i === 0 ? "34px" : "28px"};
            border-radius: 50%;
            background: ${i === 0 ? "linear-gradient(135deg, #8b5cf6, #6d28d9)" : "#4c1d95"};
            color: white; display: flex; align-items: center;
            justify-content: center; font-size: ${i === 0 ? "13px" : "11px"}; font-weight: 700;
            cursor: pointer; border: 2px solid white;
            box-shadow: ${
              i === 0
                ? "0 0 0 6px rgba(124,58,237,0.22), 0 4px 12px rgba(76,29,149,0.35)"
                : "0 2px 8px rgba(0,0,0,0.2)"
            };
            transition: transform 0.15s ease;
          `;
          el.textContent = String(i + 1);
          el.addEventListener("click", () => onSelect(r.id));
          el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.15)"; });
          el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });

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

  return <div ref={mapContainer} className="w-full h-full min-h-[300px]" />;
}
