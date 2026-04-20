import { describe, it, expect } from "vitest";
import { toSlug } from "@/lib/slug";

describe("toSlug", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(toSlug("Hello World")).toBe("hello-world");
  });

  it("strips accents and diacritics", () => {
    expect(toSlug("Héllo Wörld")).toBe("hello-world");
    expect(toSlug("Ação Rápida")).toBe("acao-rapida");
  });

  it("removes special characters", () => {
    expect(toSlug("foo & bar!")).toBe("foo-bar");
    expect(toSlug("price: $9.99")).toBe("price-999");
  });

  it("collapses multiple spaces and hyphens", () => {
    expect(toSlug("foo   bar")).toBe("foo-bar");
    expect(toSlug("foo--bar")).toBe("foo-bar");
  });

  it("strips leading and trailing hyphens", () => {
    expect(toSlug("  hello  ")).toBe("hello");
    expect(toSlug("!hello!")).toBe("hello");
  });

  it("truncates to 60 characters", () => {
    const long = "a".repeat(80);
    expect(toSlug(long).length).toBe(60);
  });

  it("appends suffix with hyphen", () => {
    expect(toSlug("hello world", "abc123")).toBe("hello-world-abc123");
  });

  it("returns slug without suffix when suffix is omitted", () => {
    expect(toSlug("hello world")).toBe("hello-world");
  });
});
