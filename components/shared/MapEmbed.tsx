"use client";
import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

interface MapEmbedProps {
  lat: number;
  lng: number;
  venue: string;
  city: string;
}

export function MapEmbed({ lat, lng, venue, city }: MapEmbedProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstance.current) return;

      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      mapInstance.current = map;

      // Dark tile layer from CartoDB
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap contributors © CARTO",
        maxZoom: 19,
      }).addTo(map);

      // Custom accent-coloured marker
      const customIcon = L.divIcon({
        html: `
          <div style="
            width:36px;height:36px;border-radius:50% 50% 50% 0;
            background:linear-gradient(135deg,#FF6B35,#FF8A5B);
            border:3px solid #fff;
            box-shadow:0 4px 15px rgba(255,107,53,0.5);
            transform:rotate(-45deg);
            display:flex;align-items:center;justify-content:center;
          ">
            <div style="transform:rotate(45deg);color:#fff;font-size:14px;">📍</div>
          </div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -40],
      });

      L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:'Sora',sans-serif;padding:4px">
            <strong style="font-size:13px;color:#0A1628">${venue}</strong>
            <br><span style="font-size:11px;color:#64748B">${city}</span>
          </div>`,
          { maxWidth: 200 }
        )
        .openPopup();
    });

    return () => {
      if (mapInstance.current) {
        (mapInstance.current as any).remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng, venue, city]);

  return (
    <div className="space-y-2">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={mapRef}
        className="w-full h-52 rounded-2xl overflow-hidden border border-white/10"
        style={{ zIndex: 1 }}
      />
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs text-white/40 hover:text-accent transition-colors"
      >
        <MapPin className="w-3.5 h-3.5" />
        {venue}, {city} — Open in Google Maps →
      </a>
    </div>
  );
}
