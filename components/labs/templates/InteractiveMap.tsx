"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { InteractiveMapConfig } from "@/lib/labs/templates/registry";

interface Props {
  config: InteractiveMapConfig;
}

export default function InteractiveMap({ config }: Props) {
  const t = useTranslations("lab");
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !mapRef.current) return;

      // Fix default icon paths broken by bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView(
        [config.center.lat, config.center.lng],
        config.zoom ?? 5
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      config.markers.forEach((m, i) => {
        const marker = L.marker([m.lat, m.lng]).addTo(map);
        marker.on("click", () => {
          if (isMounted) setSelected(i);
        });
        marker.bindTooltip(m.label, { permanent: false });
      });

      mapInstanceRef.current = map;
    })();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [config]);

  const activeMarker = selected !== null ? config.markers[selected] : null;

  return (
    <div className="lab-template-map">
      <div className="lab-template-instructions md-body">
        <p>{config.instructions}</p>
      </div>

      <div
        ref={mapRef}
        className="lab-map-canvas"
        role="application"
        aria-label={t("mapAriaLabel")}
      />

      {activeMarker && (
        <div className="lab-map-detail" role="region" aria-live="polite">
          <button
            className="lab-map-detail-close"
            onClick={() => setSelected(null)}
            aria-label={t("close")}
          >
            ×
          </button>
          <div className="lab-map-detail-label">{activeMarker.label}</div>
          {activeMarker.description && (
            <p className="lab-map-detail-desc">{activeMarker.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
