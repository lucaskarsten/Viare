export function LibraryCards() {
  return (
    <div className="relative h-36 w-full" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute left-4 right-4 rounded-lg border border-border bg-background shadow-sm"
          style={{
            top: `${8 + i * 14}px`,
            bottom: `${16 - i * 4}px`,
            transform: `translateX(${i * 6}px)`,
            opacity: 1 - i * 0.18,
          }}
        >
          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <div className="size-5 rounded bg-primary/80" />
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 w-24 rounded bg-foreground/80" />
              <div className="h-1 w-16 rounded bg-muted-foreground/40" />
            </div>
            <div className="font-mono text-[9px] text-muted-foreground">
              {i === 0 ? "47%" : i === 1 ? "12%" : "0%"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
