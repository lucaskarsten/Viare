"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { InteractiveTimelineConfig } from "@/lib/labs/templates/registry";

interface Props {
  config: InteractiveTimelineConfig;
}

export default function InteractiveTimeline({ config }: Props) {
  const t = useTranslations("lab");
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="lab-template-timeline">
      <div className="lab-template-instructions md-body">
        <p>{config.instructions}</p>
      </div>

      <div
        className={`lab-timeline-track lab-timeline-track--${config.orientation ?? "horizontal"}`}
      >
        {config.events.map((ev, i) => (
          <button
            key={i}
            className={`lab-timeline-node${selected === i ? " active" : ""}`}
            onClick={() => setSelected(selected === i ? null : i)}
            aria-pressed={selected === i}
          >
            <span className="lab-timeline-dot" />
            <span className="lab-timeline-date">{ev.date}</span>
            <span className="lab-timeline-label">{ev.label}</span>
          </button>
        ))}
      </div>

      {selected !== null ? (
        <div className="lab-timeline-detail" role="region" aria-live="polite">
          <div className="lab-timeline-detail-date">{config.events[selected].date}</div>
          <div className="lab-timeline-detail-label">{config.events[selected].label}</div>
          {config.events[selected].description && (
            <p className="lab-timeline-detail-desc">{config.events[selected].description}</p>
          )}
        </div>
      ) : (
        <p className="lab-timeline-hint">{t("timelineSelectHint")}</p>
      )}
    </div>
  );
}
