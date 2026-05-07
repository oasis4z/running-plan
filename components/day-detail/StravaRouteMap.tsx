"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface Props {
  encodedPolyline: string;
}

/** Decode Google Encoded Polyline Algorithm Format → [[lat, lng], ...] */
function decodePolyline(encoded: string): [number, number][] {
  const result: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b: number, shift = 0, val = 0;
    do { b = encoded.charCodeAt(index++) - 63; val |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += val & 1 ? ~(val >> 1) : val >> 1;
    shift = 0; val = 0;
    do { b = encoded.charCodeAt(index++) - 63; val |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += val & 1 ? ~(val >> 1) : val >> 1;
    result.push([lat / 1e5, lng / 1e5]);
  }
  return result;
}

export default function StravaRouteMap({ encodedPolyline }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep a ref to the map instance so we can remove it on unmount
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const coords = decodePolyline(encodedPolyline);
    if (coords.length === 0) return;

    (async () => {
      const L = (await import("leaflet")).default;

      // Leaflet's default icon images are broken in bundlers — suppress by overriding
      // (we're not using markers, only polyline, so this is just defensive)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "",
        iconUrl: "",
        shadowUrl: "",
      });

      if (!containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        touchZoom: false,
        doubleClickZoom: false,
        keyboard: false,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const latlngs: [number, number][] = coords;
      const route = L.polyline(latlngs, {
        color: "#f97316",
        weight: 4,
        opacity: 0.9,
      }).addTo(map);

      map.fitBounds(route.getBounds(), { padding: [16, 16] });
      mapRef.current = map;
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Only run once per polyline value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encodedPolyline]);

  return (
    <div
      ref={containerRef}
      style={{ height: 200 }}
      className="w-full rounded-xl overflow-hidden bg-gray-100"
    />
  );
}
