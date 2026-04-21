import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/labs/[labId]/route";
import { POST as submitPOST } from "@/app/api/labs/[labId]/submit/route";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/dev-auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    lab: { findUnique: vi.fn() },
    enrollment: { findUnique: vi.fn(), update: vi.fn() },
    labAttempt: { create: vi.fn(), count: vi.fn() },
    userProgress: { upsert: vi.fn(), count: vi.fn() },
    lesson: { count: vi.fn() },
    course: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/lab", () => ({
  getLabForUser: vi.fn(),
  validateFlag: vi.fn(),
}));

import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { getLabForUser, validateFlag } from "@/lib/lab";

// ── Helpers ──────────────────────────────────────────────────────────────────

const SESSION = { user: { id: "user-1", role: "STUDENT" } };
const LAB_PARAMS = { params: Promise.resolve({ labId: "lab-1" }) };

const SAFE_LAB_DATA = {
  id: "lab-1",
  title: "Lab",
  description: "desc",
  scenario: "scenario",
  objectives: [],
  difficulty: "EASY",
  hints: [
    { cost: 10, text: null },
    { cost: 20, text: null },
  ],
  revealedHintIndexes: [],
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("LAB-01 — flagHash isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue({ finalizedAt: new Date() } as never);
  });

  it("GET /labs/[labId]: campo flagHash ausente no JSON retornado", async () => {
    vi.mocked(db.lab.findUnique).mockResolvedValue({ id: "lab-1" } as never);
    vi.mocked(getLabForUser).mockResolvedValue(SAFE_LAB_DATA as never);

    const res = await GET(new Request("http://localhost/api/labs/lab-1"), LAB_PARAMS);
    const json = await res.text();

    expect(json).not.toContain("flagHash");
  });

  it("GET /labs/[labId]: hints não revelados têm text: null — LAB-01", async () => {
    vi.mocked(db.lab.findUnique).mockResolvedValue({ id: "lab-1" } as never);
    vi.mocked(getLabForUser).mockResolvedValue(SAFE_LAB_DATA as never);

    const res = await GET(new Request("http://localhost/api/labs/lab-1"), LAB_PARAMS);
    const body = await res.json();

    body.hints.forEach((h: { text: unknown }) => {
      expect(h.text).toBeNull();
    });
  });

  it("POST submit: validateFlag chamado com hash do servidor, não do body — LAB-01", async () => {
    vi.mocked(db.lab.findUnique).mockResolvedValue({ flagHash: "server_bcrypt_hash" } as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({ id: "e-1" } as never);
    vi.mocked(validateFlag).mockResolvedValue(false);
    vi.mocked(db.labAttempt.create).mockResolvedValue({} as never);
    vi.mocked(db.labAttempt.count).mockResolvedValue(1);

    await submitPOST(
      new Request("http://localhost/api/labs/lab-1/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: "FLAG{user_guess}", lessonId: "l-1", courseId: "c-1" }),
      }),
      LAB_PARAMS
    );

    expect(vi.mocked(validateFlag)).toHaveBeenCalledWith("FLAG{user_guess}", "server_bcrypt_hash");
  });

  it("POST submit: 403 quando userId não tem matrícula no courseId — AUTH-03", async () => {
    vi.mocked(db.lab.findUnique).mockResolvedValue({ flagHash: "hash" } as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(null);

    const res = await submitPOST(
      new Request("http://localhost/api/labs/lab-1/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: "FLAG{x}", lessonId: "l-1", courseId: "wrong-course" }),
      }),
      LAB_PARAMS
    );

    expect(res.status).toBe(403);
    expect(vi.mocked(db.enrollment.findUnique)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId_courseId: expect.objectContaining({ userId: "user-1" }),
        }),
      })
    );
  });
});
