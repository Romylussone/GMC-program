"use client";
import { useEffect, useRef } from "react";
import type { Property } from "@/lib/types";
import { money } from "@/lib/types";
import "leaflet/dist/leaflet.css";
export default function PropertyMap({
  properties,
}: {
  properties: Property[];
}) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;
    void import("leaflet").then((L) => {
      if (disposed || !container.current) return;
      map = L.map(container.current).setView([5.35, -3.98], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      const bounds: [number, number][] = [];
      for (const p of properties) {
        const point: [number, number] = [p.latitude, p.longitude];
        bounds.push(point);
        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = p.title;
        const price = document.createElement("p");
        price.textContent = `${money(p.price)} FCFA${p.transaction === "rent" ? " / mois" : ""}`;
        const link = document.createElement("a");
        link.href = `/biens/${p._id}`;
        link.textContent = "Découvrir ce bien →";
        popup.append(title, price, link);
        L.marker(point, {
          icon: L.divIcon({
            className: "map-pin",
            html: "<span>⌂</span>",
            iconSize: [34, 34],
            iconAnchor: [17, 34],
          }),
        })
          .addTo(map)
          .bindPopup(popup);
      }
      if (bounds.length)
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
    });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [properties]);
  return (
    <div
      className="map"
      ref={container}
      aria-label="Carte de localisation des biens"
    />
  );
}
