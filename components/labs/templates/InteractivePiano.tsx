"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { InteractivePianoConfig } from "@/lib/labs/templates/registry";

interface Props {
  config: InteractivePianoConfig;
}

const ALL_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const WHITE_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_NOTES = ["C#", "D#", "F#", "G#", "A#"];

const SCALE_INTERVALS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
};

function buildScaleNotes(root: string, scale: string, octaves: number, startOctave = 4): string[] {
  const rootIdx = ALL_NOTES.indexOf(root);
  const intervals = SCALE_INTERVALS[scale] ?? SCALE_INTERVALS.major;
  const notes: string[] = [];
  for (let o = 0; o < octaves; o++) {
    for (const interval of intervals) {
      const noteIdx = (rootIdx + interval) % 12;
      const noteOctave = startOctave + o + Math.floor((rootIdx + interval) / 12);
      notes.push(`${ALL_NOTES[noteIdx]}${noteOctave}`);
    }
  }
  return notes;
}

export default function InteractivePiano({ config }: Props) {
  const t = useTranslations("lab");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synthRef = useRef<any>(null);
  const [active, setActive] = useState<Set<string>>(new Set());
  const [audioReady, setAudioReady] = useState(false);

  const root = config.rootNote ?? "C";
  const scale = config.scale ?? "major";
  const octaves = config.octaves ?? 2;
  const startOctave = 4;

  const scaleNotes = useMemo(
    () => new Set(buildScaleNotes(root, scale, octaves, startOctave)),
    [root, scale, octaves, startOctave]
  );

  const initAudio = useCallback(async () => {
    if (synthRef.current) return;
    const Tone = await import("tone");
    await Tone.start();
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.8 },
    }).toDestination();
    setAudioReady(true);
  }, []);

  const playNote = useCallback(
    async (noteStr: string) => {
      if (!scaleNotes.has(noteStr)) return;
      await initAudio();
      setActive((prev) => new Set(prev).add(noteStr));
      synthRef.current?.triggerAttack(noteStr);
    },
    [initAudio, scaleNotes]
  );

  const releaseNote = useCallback((noteStr: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      next.delete(noteStr);
      return next;
    });
    synthRef.current?.triggerRelease(noteStr);
  }, []);

  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  const whiteKeys: string[] = [];
  const blackKeys: string[] = [];

  for (let o = startOctave; o < startOctave + octaves; o++) {
    for (const n of WHITE_NOTES) {
      whiteKeys.push(`${n}${o}`);
    }
    for (const n of BLACK_NOTES) {
      blackKeys.push(`${n}${o}`);
    }
  }

  const blackKeyPosition = (noteStr: string): number => {
    const note = noteStr.replace(/\d/, "");
    const octave = parseInt(noteStr.slice(-1));
    const notesBefore: Record<string, number> = { "C#": 0, "D#": 1, "F#": 3, "G#": 4, "A#": 5 };
    const whiteOffset = (octave - startOctave) * 7 + (notesBefore[note] ?? 0);
    return whiteOffset;
  };

  return (
    <div className="lab-template-piano">
      <div className="lab-template-instructions md-body">
        <p>{config.instructions}</p>
      </div>

      <p className="lab-piano-scale-label">
        {root} {scale}
      </p>

      {!audioReady && <p className="lab-piano-hint">{t("pianoClickToEnable")}</p>}

      <div className="lab-piano-wrapper" role="group" aria-label={t("pianoAriaLabel")}>
        <div
          className="lab-piano-keys"
          style={{ "--key-count": whiteKeys.length } as React.CSSProperties}
        >
          {whiteKeys.map((noteStr) => {
            const inScale = scaleNotes.has(noteStr);
            return (
              <button
                key={noteStr}
                className={`lab-piano-white${active.has(noteStr) ? " pressed" : ""}${inScale ? " in-scale" : " out-scale"}`}
                onPointerDown={() => playNote(noteStr)}
                onPointerUp={() => releaseNote(noteStr)}
                onPointerLeave={() => releaseNote(noteStr)}
                aria-label={noteStr}
                aria-disabled={!inScale}
              >
                {noteStr.startsWith("C") && <span className="lab-piano-key-label">{noteStr}</span>}
              </button>
            );
          })}

          {blackKeys.map((noteStr) => {
            const inScale = scaleNotes.has(noteStr);
            const pos = blackKeyPosition(noteStr);
            return (
              <button
                key={noteStr}
                className={`lab-piano-black${active.has(noteStr) ? " pressed" : ""}${inScale ? " in-scale" : " out-scale"}`}
                style={{ left: `calc(${pos} * var(--key-w) + var(--key-w) * 0.65)` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  playNote(noteStr);
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  releaseNote(noteStr);
                }}
                onPointerLeave={() => releaseNote(noteStr)}
                aria-label={noteStr}
                aria-disabled={!inScale}
              />
            );
          })}
        </div>
      </div>

      {config.exerciseNotes && config.exerciseNotes.length > 0 && (
        <div className="lab-piano-exercise">
          <span className="lab-piano-exercise-label">{t("pianoExerciseLabel")}</span>
          <span className="lab-piano-exercise-notes">{config.exerciseNotes.join(" → ")}</span>
        </div>
      )}
    </div>
  );
}
