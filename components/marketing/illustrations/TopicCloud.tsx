export function TopicCloud() {
  const topics = [
    { label: "rust", size: "text-sm", weight: "font-medium" },
    { label: "postgres", size: "text-[13px]" },
    { label: "system design", size: "text-base", weight: "font-medium" },
    { label: "guitar", size: "text-xs" },
    { label: "spanish", size: "text-[13px]" },
    { label: "llms", size: "text-sm" },
    { label: "bread", size: "text-xs" },
    { label: "statistics", size: "text-sm" },
    { label: "css", size: "text-xs" },
    { label: "history", size: "text-[13px]" },
  ];
  return (
    <div
      className="h-36 w-full flex flex-wrap content-center items-center gap-1.5"
      aria-hidden="true"
    >
      {topics.map((t, i) => (
        <span
          key={t.label}
          className={`font-mono ${t.size} ${t.weight ?? ""} px-2 py-0.5 rounded-full border border-border text-muted-foreground`}
          style={{ opacity: 0.55 + ((i * 53) % 40) / 100 }}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}
