import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/user/confirm-age/route";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/dev-auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      update: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/user/confirm-age", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const MOCK_SESSION = { user: { id: "user-1" } };

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/user/confirm-age", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await POST(makeRequest({ birthDate: "2000-01-01" }) as never);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  it("returns 403 when user is underage (17)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);

    // Born 17 years ago relative to test execution
    const underage = new Date();
    underage.setFullYear(underage.getFullYear() - 17);
    const birthDate = underage.toISOString().slice(0, 10);

    const res = await POST(makeRequest({ birthDate }) as never);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("age_below_minimum");
  });

  it("returns 200 and updates user when age is 25", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.user.update).mockResolvedValue({} as never);

    const adult = new Date();
    adult.setFullYear(adult.getFullYear() - 25);
    const birthDate = adult.toISOString().slice(0, 10);

    const res = await POST(makeRequest({ birthDate }) as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.ageConfirmedAt).toBeDefined();

    expect(vi.mocked(db.user.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          birthDate: expect.any(Date),
          ageConfirmedAt: expect.any(Date),
        }),
      })
    );
  });
});
