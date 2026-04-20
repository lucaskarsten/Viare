export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-foreground ${className ?? ""}`}
      aria-hidden="true"
    >
      <span
        className="inline-block size-4 rounded-[5px] bg-foreground"
        style={{
          maskImage:
            "radial-gradient(circle at 30% 30%, transparent 0 22%, black 22% 52%, transparent 52% 100%)",
          WebkitMaskImage:
            "radial-gradient(circle at 30% 30%, transparent 0 22%, black 22% 52%, transparent 52% 100%)",
        }}
      />
      <span className="font-medium tracking-[-0.01em] text-[15px]">Viare</span>
    </span>
  );
}
