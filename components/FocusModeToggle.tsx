"use client";
import { useState, useEffect } from "react";

export default function FocusModeToggle() {
  const [active, setActive] = useState(false);

  const toggle = () => {
    setActive(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.setAttribute("data-focus-mode", "true");
      } else {
        document.documentElement.removeAttribute("data-focus-mode");
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
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
      className={`text-[11px] font-mono px-2 py-1 rounded border transition-colors ${active ? "border-accent text-accent bg-accent/10" : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"}`}
    >
      F
    </button>
  );
}
