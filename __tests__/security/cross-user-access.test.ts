import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as issuePOST } from "@/app/api/certificates/issue/route";
import { GET as reflectionsGET } from "@/app/api/reflections/route";
import { POST as labSubmitPOST } from "@/app/api/labs/[labId]/submit/route";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/dev-auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/certificates", () => ({ issueCertificate: vi.fn() }));
vi.mock("@/lib/lab", () => ({ validateFlag: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    enrollment: { findUnique: vi.fn() },
    reflectionResponse: { findUnique: vi.fn() },
    lab: { findUnique: vi.fn() },
    labAttempt: { create: vi.fn(), count: vi.fn() },
  },
}));

import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────────────

const SESSION_USER_1 = { user: { id: "user-1", role: "STUDENT" } };

// ── Tests ────────────────────────────────────────────────────────────────────

describe("AUTH-03 — cross-user data access prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(SESSION_USER_1 as never);
  });

  it("POST /certificates/issue: 403 quando enrollment.userId !== session.user.id", async () => {
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({
      id: "e-1",
      userId: "other-user-999",
      status: "COMPLETED",
    } as never);

    const res = await issuePOST(
      new Request("http://localhost/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: "e-1" }),
      })
    );

    expect(res.status).toBe(403);
  });

  it("GET /reflections: query inclui userId da sessão no WHERE — AUTH-03", async () => {
    vi.mocked(db.reflectionResponse.findUnique).mockResolvedValue(null);

    await reflectionsGET(new Request("http://localhost/api/reflections?lessonId=l-1"));

    expect(vi.mocked(db.reflectionResponse.findUnique)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId_lessonId: expect.objectContaining({ userId: "user-1" }),
        }),
      })
    );
  });

  it("GET /reflections: não expõe reflexão de outro usuário", async () => {
    // Simula que o DB retorna null porque o WHERE filtra por userId da sessão
    vi.mocked(db.reflectionResponse.findUnique).mockResolvedValue(null);

    const res = await reflectionsGET(new Request("http://localhost/api/reflections?lessonId=l-1"));
    const body = await res.json();

    expect(body.content).toBeNull();
  });

  it("POST /labs/[labId]/submit: 403 quando userId não tem matrícula no courseId", async () => {
    vi.mocked(db.lab.findUnique).mockResolvedValue({ flagHash: "hash" } as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(null);

    const res = await labSubmitPOST(
      new Request("http://localhost/api/labs/lab-1/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: "FLAG{x}", lessonId: "l-1", courseId: "not-enrolled" }),
      }),
      { params: Promise.resolve({ labId: "lab-1" }) }
    );

    expect(res.status).toBe(403);
  });

  it("POST /labs/[labId]/submit: enrollment lookup usa userId da sessão", async () => {
    vi.mocked(db.lab.findUnique).mockResolvedValue({ flagHash: "hash" } as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(null);

    await labSubmitPOST(
      new Request("http://localhost/api/labs/lab-1/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: "FLAG{x}", lessonId: "l-1", courseId: "c-1" }),
      }),
      { params: Promise.resolve({ labId: "lab-1" }) }
    );

    expect(vi.mocked(db.enrollment.findUnique)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId_courseId: expect.objectContaining({ userId: "user-1" }),
        }),
      })
    );
  });
});
