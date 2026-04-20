"use client";

import dynamic from "next/dynamic";

const DEMOS: Record<string, React.ComponentType> = {
  "bubble-sort": dynamic(() => import("@/components/demos/BubbleSort")),
  "binary-search": dynamic(() => import("@/components/demos/BinarySearch")),
  "css-flexbox": dynamic(() => import("@/components/demos/CssFlexbox")),
};

export default function DemoBlock({ id }: { id: string }) {
  const Demo = DEMOS[id];
  if (!Demo) return null;
  return <Demo />;
}
