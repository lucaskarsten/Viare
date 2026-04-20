"use client";

import type { LabData } from "@/lib/lab";
import { CtfLabBlock } from "./labs/CtfLabBlock";
import { InteractiveLabBlock } from "./labs/InteractiveLabBlock";

interface LabBlockProps {
  labData: LabData;
  lessonId: string;
  courseId: string;
  nextLessonHref: string;
  isCompleted: boolean;
}

export default function LabBlock(props: LabBlockProps) {
  if (props.labData.type === "CTF") {
    return <CtfLabBlock {...props} labData={props.labData} />;
  }
  return (
    <InteractiveLabBlock {...props} labData={props.labData} nextLessonHref={props.nextLessonHref} />
  );
}
