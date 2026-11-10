"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RankedResult } from "@/lib/types";

interface Props {
  results: RankedResult[];
  center: { lat: number; lng: number };
  onSelect: (id: string) => void;
}

// Hand-drawn Toronto landmarks — decorative markers that give the map
// local charm. Non-interactive so they never block provider pins.
const LANDMARKS: { name: string; lat: number; lng: number; svg: string }[] = [
  {
    name: "CN Tower",
    lat: 43.6426,
    lng: -79.3871,
    svg: `<svg width="22" height="46" viewBox="0 0 20 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="1" x2="10" y2="9" stroke="#6d28d9" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="10" cy="2" r="1.4" fill="#a78bfa"/>
      <ellipse cx="10" cy="13" rx="6.5" ry="4" fill="#ede9fe" stroke="#6d28d9" stroke-width="1.6"/>
      <line x1="4.5" y1="13.6" x2="15.5" y2="13.6" stroke="#6d28d9" stroke-width="1"/>
      <path d="M8.2 17 L11.8 17 L11 35 L9 35 Z" fill="#ede9fe" stroke="#6d28d9" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M9 35 C6 37 4.5 40 4 42 L16 42 C15.5 40 14 37 11 35 Z" fill="#ede9fe" stroke="#6d28d9" stroke-width="1.4" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    name: "Casa Loma",
    lat: 43.678,
    lng: -79.4094,
    svg: `<svg width="34" height="30" viewBox="0 0 34 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12 L8 7 L12 12 Z" fill="#c4b5fd" stroke="#6d28d9" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M22 12 L26 7 L30 12 Z" fill="#c4b5fd" stroke="#6d28d9" stroke-width="1.4" stroke-linejoin="round"/>
      <rect x="5" y="12" width="6" height="16" fill="#ede9fe" stroke="#6d28d9" stroke-width="1.4"/>
      <rect x="23" y="12" width="6" height="16" fill="#ede9fe" stroke="#6d28d9" stroke-width="1.4"/>
      <path d="M11 16 L13 16 L13 14 L15 14 L15 16 L19 16 L19 14 L21 14 L21 16 L23 16 L23 28 L11 28 Z" fill="#ede9fe" stroke="#6d28d9" stroke-width="1.4" stroke-linejoin="round"/>
      <rect x="15.5" y="21" width="3" height="7" rx="1.5" fill="#6d28d9"/>
      <line x1="8" y1="7" x2="8" y2="4.5" stroke="#6d28d9" stroke-width="1.2"/>
      <path d="M8 4.5 L11 5.5 L8 6.5 Z" fill="#7c3aed"/>
    </svg>`,
  },
  {
    name: "High Park",
    lat: 43.6465,
    lng: -79.4637,
    svg: `<svg width="30" height="30" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12.6" y="17" width="2.8" height="9" rx="1.2" fill="#92400e"/>
      <circle cx="9" cy="13" r="5.5" fill="#6ee7b7" stroke="#047857" stroke-width="1.4"/>
      <circle cx="19" cy="13.5" r="5" fill="#6ee7b7" stroke="#047857" stroke-width="1.4"/>
      <circle cx="14" cy="8.5" r="6" fill="#a7f3d0" stroke="#047857" stroke-width="1.4"/>
    </svg>`,
  },
];

function relativeSlotTime(iso: string): string {
  const min = Math.floor((new Date(iso).getTime() - Date.now()) / 60000);
  if (min < 0) return "Now";
  if (min < 60) return `in ${min} min`;
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday ? `Today ${time}` : `${d.toLocaleDateString([], { weekday: "short" })} ${time}`;
}

// Preview card shown when a map pin is clicked. Built with DOM APIs (not
// innerHTML) so listing data is always rendered as text.
function buildPopupCard(r: RankedResult, onView: () => void): HTMLElement {
  const card = document.createElement("div");
  card.style.cssText =
    "font-family:inherit;min-width:208px;max-width:246px;padding:4px 2px 2px;display:flex;flex-direction:column;gap:7px;";

  const name = document.createElement("div");
  name.textContent = r.name;
  name.style.cssText = "font-weight:800;font-size:14px;line-height:1.25;color:#1c1917;";
  card.appendChild(name);

  const addr = document.createElement("div");
  addr.textContent = r.address;
  addr.style.cssText = "font-size:11px;color:#a8a29e;margin-top:-4px;";
  card.appendChild(addr);

  const meta = document.createElement("div");
  meta.style.cssText =
    "display:flex;align-items:center;gap:8px;font-size:11.5px;color:#57534e;flex-wrap:wrap;";
  const rating = document.createElement("span");
  rating.textContent =
    r.ratingCount > 0 ? `★ ${r.ratingAvg.toFixed(1)} (${r.ratingCount})` : "✦ New";
  meta.appendChild(rating);
  const price = document.createElement("span");
  price.textContent =
    "$".repeat(r.priceTier) +
    (r.services.length > 0
      ? ` · from $${Math.round(Math.min(...r.services.map((s) => s.priceCents)) / 100)}`
      : "");
  meta.appendChild(price);
  if (r.distanceKm !== undefined) {
    const dist = document.createElement("span");
    dist.textContent =
      r.distanceKm < 1 ? `${Math.round(r.distanceKm * 1000)}m` : `${r.distanceKm.toFixed(1)} km`;
    meta.appendChild(dist);
  }
  card.appendChild(meta);

  const status = document.createElement("div");
  if (r.tier === "live" && r.soonestSlot) {
    status.textContent = `⚡ Next opening ${relativeSlotTime(r.soonestSlot.startsAt)}`;
    status.style.cssText =
      "font-size:11.5px;font-weight:700;color:#047857;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:999px;padding:3px 9px;align-self:flex-start;";
  } else {
    status.textContent = "Books on their own site";
    status.style.cssText =
      "font-size:11px;font-weight:600;color:#78716c;background:#f5f5f4;border-radius:999px;padding:3px 9px;align-self:flex-start;";
  }
  card.appendChild(status);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = r.tier === "live" ? "See times & book" : "View & book";
  btn.style.cssText =
    "margin-top:2px;width:100%;padding:9px 12px;border:none;border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;font-weight:700;font-size:12.5px;cursor:pointer;";
  btn.addEventListener("click", onView);
  card.appendChild(btn);

  return card;
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
      let userMoved = false;
      map.on("dragstart", () => { userMoved = true; });
      map.on("zoomstart", () => { userMoved = true; });
      const ro = new ResizeObserver(() => {
        map.resize();
        if (!userMoved) {
          map.jumpTo({ center: [center.lng, center.lat], zoom: 12 });
        }
      });
      ro.observe(mapContainer.current);
      map.once("remove", () => ro.disconnect());

      map.on("load", () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        for (const lm of LANDMARKS) {
          const el = document.createElement("div");
          el.style.cssText =
            "display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;";
          el.innerHTML = `
            ${lm.svg}
            <span style="
              font-size:9px;font-weight:700;color:#6d28d9;
              background:rgba(255,255,255,0.85);padding:1px 7px;
              border-radius:999px;border:1px solid #ede9fe;white-space:nowrap;
            ">${lm.name}</span>
          `;
          const marker = new mapboxgl.default.Marker(el)
            .setLngLat([lm.lng, lm.lat])
            .addTo(map);
          markersRef.current.push(marker);
        }

        results.forEach((r, i) => {
          // Mapbox positions the marker by writing an inline
          // `transform: translate(...)` onto the element it is given, so that
          // element's transform must never be touched — scale a child instead.
          const el = document.createElement("div");
          el.style.cursor = "pointer";
          const pin = document.createElement("div");
          pin.className = "map-marker";
          pin.style.cssText = `
            width: ${i === 0 ? "34px" : "28px"}; height: ${i === 0 ? "34px" : "28px"};
            border-radius: 50%;
            background: ${i === 0 ? "linear-gradient(135deg, #8b5cf6, #6d28d9)" : "#4c1d95"};
            color: white; display: flex; align-items: center;
            justify-content: center; font-size: ${i === 0 ? "13px" : "11px"}; font-weight: 700;
            border: 2px solid white;
            box-shadow: ${
              i === 0
                ? "0 0 0 6px rgba(124,58,237,0.22), 0 4px 12px rgba(76,29,149,0.35)"
                : "0 2px 8px rgba(0,0,0,0.2)"
            };
            transition: transform 0.15s ease;
          `;
          pin.textContent = String(i + 1);
          el.appendChild(pin);
          el.addEventListener("mouseenter", () => { pin.style.transform = "scale(1.15)"; });
          el.addEventListener("mouseleave", () => { pin.style.transform = "scale(1)"; });

          // Clicking a pin opens a preview card anchored to it (Mapbox
          // toggles the attached popup); navigation only happens from the
          // card's button.
          const marker = new mapboxgl.default.Marker(el)
            .setLngLat([r.lng, r.lat])
            .setPopup(
              new mapboxgl.default.Popup({
                offset: 22,
                closeButton: false,
                maxWidth: "270px",
              }).setDOMContent(buildPopupCard(r, () => onSelect(r.id)))
            )
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
