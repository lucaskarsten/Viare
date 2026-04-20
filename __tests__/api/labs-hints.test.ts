import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/labs/[labId]/hints/[hintIndex]/route";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/dev-auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    lab: { findUnique: vi.fn() },
    hintReveal: { findUnique: vi.fn(), create: vi.fn() },
    userXP: { findUnique: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { STARTING_XP } from "@/lib/lab";

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_SESSION = { user: { id: "user-1", role: "STUDENT" } };
const HINTS = [
  { text: "First hint", cost: 10 },
  { text: "Second hint", cost: 20 },
];

function makeParams(hintIndex: number | string) {
  return { params: Promise.resolve({ labId: "lab-1", hintIndex: String(hintIndex) }) };
}

function makeRequest() {
  return new Request("http://localhost/api/labs/lab-1/hints/0", { method: "POST" });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/labs/[labId]/hints/[hintIndex]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AUTH-01
  it("retorna 401 sem sessão", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await POST(makeRequest(), makeParams(0));

    expect(res.status).toBe(401);
  });

  it("retorna 400 para hintIndex inválido (NaN)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);

    const res = await POST(makeRequest(), makeParams("abc"));

    expect(res.status).toBe(400);
  });

  it("retorna 400 para hintIndex negativo", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);

    const res = await POST(makeRequest(), makeParams(-1));

    expect(res.status).toBe(400);
  });

  it("retorna 404 quando lab não existe", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams(0));

    expect(res.status).toBe(404);
  });

  it("retorna 404 quando hintIndex está fora do range", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue({ hints: HINTS } as never);

    const res = await POST(makeRequest(), makeParams(5));

    expect(res.status).toBe(404);
  });

  // Idempotência — LAB-02
  it("reveal já feito: retorna text sem debitar XP novamente", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue({ hints: HINTS } as never);
    vi.mocked(db.hintReveal.findUnique).mockResolvedValue({ id: "reveal-1" } as never);
    vi.mocked(db.userXP.findUnique).mockResolvedValue({ points: 90 } as never);

    const res = await POST(makeRequest(), makeParams(0));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.hint).toBe("First hint");
    expect(body.xpRemaining).toBe(90);
    expect(vi.mocked(db.$transaction)).not.toHaveBeenCalled();
  });

  it("reveal já feito: xpRemaining = STARTING_XP quando userXP não existe", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue({ hints: HINTS } as never);
    vi.mocked(db.hintReveal.findUnique).mockResolvedValue({ id: "reveal-1" } as never);
    vi.mocked(db.userXP.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams(0));
    const body = await res.json();

    expect(body.xpRemaining).toBe(STARTING_XP);
  });

  // LAB-02: reveal + XP debit devem ser atômicos
  it("primeiro reveal: cria HintReveal + debita XP em $transaction — LAB-02", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue({ hints: HINTS } as never);
    vi.mocked(db.hintReveal.findUnique).mockResolvedValue(null);
    vi.mocked(db.hintReveal.create).mockResolvedValue({} as never);
    vi.mocked(db.userXP.upsert).mockResolvedValue({ points: 90 } as never);
    vi.mocked(db.$transaction).mockResolvedValue([{}, { points: 90 }] as never);

    const res = await POST(makeRequest(), makeParams(0));
    const body = await res.json();

    expect(vi.mocked(db.$transaction)).toHaveBeenCalledOnce();
    expect(body.hint).toBe("First hint");
    expect(body.xpRemaining).toBe(90);
  });

  it("XP upsert usa create com STARTING_XP - cost para novos usuários", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue({ hints: HINTS } as never);
    vi.mocked(db.hintReveal.findUnique).mockResolvedValue(null);
    vi.mocked(db.hintReveal.create).mockResolvedValue({} as never);
    vi.mocked(db.userXP.upsert).mockResolvedValue({ points: STARTING_XP - 10 } as never);
    vi.mocked(db.$transaction).mockResolvedValue([{}, { points: STARTING_XP - 10 }] as never);

    await POST(makeRequest(), makeParams(0));

    expect(vi.mocked(db.userXP.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ points: STARTING_XP - 10 }),
      })
    );
  });
});
