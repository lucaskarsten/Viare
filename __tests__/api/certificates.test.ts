import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/certificates/issue/route";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/dev-auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    enrollment: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/certificates", () => ({
  issueCertificate: vi.fn(),
}));

import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { issueCertificate } from "@/lib/certificates";

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_SESSION = { user: { id: "user-1", role: "STUDENT" } };
const COMPLETED_ENROLLMENT = { id: "enrollment-1", userId: "user-1", status: "COMPLETED" };
const MOCK_CERT = { id: "cert-1", enrollmentId: "enrollment-1" };

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/certificates/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/certificates/issue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AUTH-01
  it("retorna 401 sem sessão", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await POST(makeRequest({ enrollmentId: "e-1" }));

    expect(res.status).toBe(401);
  });

  it("retorna 400 com body inválido (enrollmentId ausente)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("retorna 404 quando enrollment não existe", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest({ enrollmentId: "nonexistent" }));

    expect(res.status).toBe(404);
  });

  // AUTH-03: verificação de ownership
  it("retorna 403 quando enrollment pertence a outro userId — AUTH-03", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({
      ...COMPLETED_ENROLLMENT,
      userId: "other-user",
    } as never);

    const res = await POST(makeRequest({ enrollmentId: "enrollment-1" }));

    expect(res.status).toBe(403);
  });

  // CERT-01: somente enrollment COMPLETED
  it("retorna 422 quando enrollment não está COMPLETED — CERT-01", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({
      ...COMPLETED_ENROLLMENT,
      status: "IN_PROGRESS",
    } as never);

    const res = await POST(makeRequest({ enrollmentId: "enrollment-1" }));

    expect(res.status).toBe(422);
  });

  it("emite certificado via issueCertificate e retorna 200", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(COMPLETED_ENROLLMENT as never);
    vi.mocked(issueCertificate).mockResolvedValue(MOCK_CERT as never);

    const res = await POST(makeRequest({ enrollmentId: "enrollment-1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("cert-1");
    expect(vi.mocked(issueCertificate)).toHaveBeenCalledWith("enrollment-1");
  });

  // CERT-02: idempotência via issueCertificate
  it("chamada idempotente: issueCertificate retorna existente — CERT-02", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(COMPLETED_ENROLLMENT as never);
    vi.mocked(issueCertificate).mockResolvedValue(MOCK_CERT as never);

    const res = await POST(makeRequest({ enrollmentId: "enrollment-1" }));

    expect(res.status).toBe(200);
    expect(vi.mocked(issueCertificate)).toHaveBeenCalledOnce();
  });
});
