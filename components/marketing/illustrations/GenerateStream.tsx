export function GenerateStream() {
  const lessons = [
    { label: "Intro", w: "w-24", done: true },
    { label: "Fundamentals", w: "w-32", done: true },
    { label: "Patterns", w: "w-28", done: true },
    { label: "Advanced", w: "w-20", done: false },
    { label: "Projects", w: "w-24", done: false },
  ];
  return (
    <div className="h-36 w-full flex flex-col gap-1.5" aria-hidden="true">
      <div className="rounded-md border border-border bg-background px-2.5 py-1.5 flex items-center gap-2">
        <span className="font-mono text-[9px] text-muted-foreground">›</span>
        <span className="font-mono text-[10px] text-foreground truncate">
          https://example.com/article
        </span>
        <span className="ml-auto size-1.5 rounded-full bg-primary animate-pulse" />
      </div>
      <div className="flex-1 flex flex-col gap-1 pt-0.5">
        {lessons.map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <span
              className={`font-mono text-[10px] ${
                l.done ? "text-primary" : "text-muted-foreground/40"
              }`}
            >
              {l.done ? "✓" : "·"}
            </span>
            <div
              className={`h-1.5 ${l.w} rounded ${l.done ? "bg-foreground/70" : "bg-muted-foreground/25"}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
