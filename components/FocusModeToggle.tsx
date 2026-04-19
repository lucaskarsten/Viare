"use client";
import { useEffect, useState } from "react";

/**
 * Lightweight focus-mode toggle.
 * Note: The dedicated `LessonClient` manages its own focus state for the lesson page.
 * This component remains available as a standalone toggle for other contexts.
 */
export default function FocusModeToggle() {
  const [active, setActive] = useState(false);

  const toggle = () => {
    setActive((prev) => {
      const next = !prev;
      document.body.dataset.focus = next ? "on" : "off";
      return next;
    });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <button
      onClick={toggle}
      title="Modo foco (F)"
      className={`ghost small focus-toggle${active ? " on" : ""}`}
    >
      <span className="focus-icon">◐</span> Foco
    </button>
  );
}
