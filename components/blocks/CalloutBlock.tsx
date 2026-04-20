import { Info, Lightbulb, AlertTriangle, CircleAlert, Flame } from "lucide-react";
import type { ReactNode, FC } from "react";

export type CalloutType = "note" | "tip" | "warning" | "caution" | "important";

const CONFIGS: Record<
  CalloutType,
  { Icon: FC<{ size?: number }>; cssClass: string; label: string }
> = {
  note: { Icon: Info, cssClass: "callout-note", label: "Note" },
  tip: { Icon: Lightbulb, cssClass: "callout-tip", label: "Tip" },
  warning: { Icon: AlertTriangle, cssClass: "callout-warning", label: "Warning" },
  caution: { Icon: CircleAlert, cssClass: "callout-caution", label: "Caution" },
  important: { Icon: Flame, cssClass: "callout-important", label: "Important" },
};

type Props = { type: CalloutType; children: ReactNode };

export default function CalloutBlock({ type, children }: Props) {
  const { Icon, cssClass, label } = CONFIGS[type] ?? CONFIGS.note;
  return (
    <div className={`callout ${cssClass}`} role="note" aria-label={label}>
      <div className="callout-icon">
        <Icon size={15} />
      </div>
      <div className="callout-body">{children}</div>
    </div>
  );
}
