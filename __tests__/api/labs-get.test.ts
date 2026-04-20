import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/labs/[labId]/route";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/dev-auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    lab: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/lab", () => ({
  getLabForUser: vi.fn(),
}));

import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { getLabForUser } from "@/lib/lab";

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_SESSION = { user: { id: "user-1", role: "STUDENT" } };
const PARAMS = { params: Promise.resolve({ labId: "lab-1" }) };
const LAB_DATA = {
  id: "lab-1",
  title: "Test Lab",
  description: "desc",
  scenario: "scenario",
  objectives: ["obj1"],
  difficulty: "EASY",
  hints: [{ cost: 10, text: null }],
  revealedHintIndexes: [],
};

function makeRequest() {
  return new Request("http://localhost/api/labs/lab-1", { method: "GET" });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/labs/[labId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AUTH-01
  it("retorna 401 sem sessão", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await GET(makeRequest(), PARAMS);

    expect(res.status).toBe(401);
  });

  it("retorna 404 quando lab não existe", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue(null);

    const res = await GET(makeRequest(), PARAMS);

    expect(res.status).toBe(404);
  });

  it("retorna 404 quando getLabForUser retorna null", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue({ id: "lab-1" } as never);
    vi.mocked(getLabForUser).mockResolvedValue(null);

    const res = await GET(makeRequest(), PARAMS);

    expect(res.status).toBe(404);
  });

  // LAB-01: hints mascarados via getLabForUser
  it("retorna lab com hints mascarados via getLabForUser — LAB-01", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue({ id: "lab-1" } as never);
    vi.mocked(getLabForUser).mockResolvedValue(LAB_DATA as never);

    const res = await GET(makeRequest(), PARAMS);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("lab-1");
    expect(body.hints[0].text).toBeNull();
  });

  // LAB-01 SECURITY: flagHash nunca no JSON
  it("resposta JSON não contém campo flagHash em nenhum nível — LAB-01", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue({ id: "lab-1" } as never);
    vi.mocked(getLabForUser).mockResolvedValue(LAB_DATA as never);

    const res = await GET(makeRequest(), PARAMS);
    const json = await res.text();

    expect(json).not.toContain("flagHash");
  });

  it("getLabForUser é chamado com labId e userId da sessão", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue({ id: "lab-1" } as never);
    vi.mocked(getLabForUser).mockResolvedValue(LAB_DATA as never);

    await GET(makeRequest(), PARAMS);

    expect(vi.mocked(getLabForUser)).toHaveBeenCalledWith("lab-1", "user-1");
  });
});
