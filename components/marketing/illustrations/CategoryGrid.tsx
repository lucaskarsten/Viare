import { Code2, Languages, Music, UtensilsCrossed, FlaskConical, Sparkles } from "lucide-react";

export function CategoryGrid() {
  const items = [
    { icon: Code2, label: "tech" },
    { icon: Languages, label: "lang" },
    { icon: Music, label: "music" },
    { icon: UtensilsCrossed, label: "cook" },
    { icon: FlaskConical, label: "sci" },
    { icon: Sparkles, label: "life" },
  ];
  return (
    <div className="h-36 w-full grid grid-cols-3 gap-2" aria-hidden="true">
      {items.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background"
        >
          <Icon className="size-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-muted-foreground">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
