export type SM2Card = {
  easeFactor: number;
  interval: number;
  repetitions: number;
};

export type SM2Result = SM2Card & { dueAt: Date };

// rating: 0=again, 1=hard, 2=good, 3=easy → SM-2 quality: 0, 3, 4, 5
const QUALITY = [0, 3, 4, 5] as const;

export function sm2(card: SM2Card, rating: 0 | 1 | 2 | 3): SM2Result {
  const q = QUALITY[rating];
  let { easeFactor, interval, repetitions } = card;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  }

  const dueAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
  return { easeFactor, interval, repetitions, dueAt };
}
