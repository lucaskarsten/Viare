export function Heatmap() {
  const cols = 13;
  const rows = 7;
  const pattern = [
    0, 1, 2, 1, 0, 0, 1, 3, 2, 4, 3, 2, 1, 0, 1, 2, 3, 4, 2, 1, 0, 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 1,
    2, 3, 2, 1, 0, 0, 1, 2, 3, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 3, 2, 1, 0,
    0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 0, 1,
  ];
  const levels = ["bg-muted", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/90"];
  return (
    <div
      className="h-36 w-full grid gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      aria-hidden="true"
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div
          key={i}
          className={`rounded-[2px] aspect-square ${levels[pattern[i % pattern.length]]}`}
        />
      ))}
    </div>
  );
}
