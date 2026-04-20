export function FlashcardMock() {
  return (
    <div className="h-36 w-full flex flex-col gap-2.5" aria-hidden="true">
      <div className="flex-1 rounded-lg border border-border bg-background p-3 flex flex-col justify-center gap-1.5">
        <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-muted-foreground">
          question
        </div>
        <div className="space-y-1">
          <div className="h-1.5 w-3/4 rounded bg-foreground/80" />
          <div className="h-1.5 w-1/2 rounded bg-foreground/60" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {["again", "hard", "good", "easy"].map((label, i) => (
          <div
            key={label}
            className="rounded border border-border bg-background py-1 text-center font-mono text-[9px] tracking-[0.04em] text-muted-foreground"
            style={{ opacity: 0.55 + i * 0.15 }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
