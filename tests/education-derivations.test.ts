import { describe, expect, it } from "vitest";

import { documentationName } from "@/lib/education/documentation-name";
import { fingerprintDocumentation } from "@/lib/education/fingerprint";
import { computeFreshness } from "@/lib/education/freshness";

/**
 * Direct unit tests for the pure education derivations (pattern
 * established by the quiz logic module).
 */

describe("fingerprintDocumentation", () => {
  it("is deterministic and ignores surrounding whitespace", () => {
    const a = fingerprintDocumentation("How to create a widget.");
    const b = fingerprintDocumentation("  How to create a widget.  \n");

    expect(a).toBe(b);
    expect(a).toMatch(/^doc-[0-9a-f]{8}$/);
  });

  it("changes when the documentation changes", () => {
    expect(fingerprintDocumentation("version one")).not.toBe(
      fingerprintDocumentation("version two"),
    );
  });
});

describe("documentationName", () => {
  it("uses the first Markdown H1 heading", () => {
    expect(documentationName("# Matter Search\n\nSearch across matters.")).toBe(
      "Matter Search",
    );
  });

  it("ignores closing hashes and leading blank lines", () => {
    expect(documentationName("\n\n#   Billing Portal   #\n\nText")).toBe(
      "Billing Portal",
    );
  });

  it("does not treat a deeper heading as the name", () => {
    // "## Overview" is not an H1, so the first non-empty line wins.
    expect(documentationName("Release Notes\n\n## Overview")).toBe(
      "Release Notes",
    );
  });

  it("falls back to the first non-empty line when there is no heading", () => {
    expect(documentationName("   \n\nMatter Search overview\nMore text")).toBe(
      "Matter Search overview",
    );
  });

  it("returns an empty string for blank input", () => {
    expect(documentationName("   \n\t\n")).toBe("");
  });
});

describe("computeFreshness", () => {
  const now = new Date("2026-07-07T00:00:00.000Z");

  it("scores a just-reviewed asset as 100 / Fresh", () => {
    const freshness = computeFreshness(
      {
        publishedAt: "2026-01-01T00:00:00.000Z",
        lastReviewedAt: "2026-07-07T00:00:00.000Z",
      },
      now,
    );

    expect(freshness).toEqual({ score: 100, label: "Fresh" });
  });

  it("prefers the most recent of publish and review dates", () => {
    // Published recently but reviewed long ago: the newer date wins.
    const freshness = computeFreshness(
      {
        publishedAt: "2026-07-06T00:00:00.000Z",
        lastReviewedAt: "2025-01-01T00:00:00.000Z",
      },
      now,
    );

    expect(freshness?.score).toBe(99);
  });

  it("decays with age and eventually reads Stale", () => {
    const aging = computeFreshness(
      { publishedAt: "2026-04-08T00:00:00.000Z" }, // 90 days old
      now,
    );
    const stale = computeFreshness(
      { publishedAt: "2025-07-07T00:00:00.000Z" }, // a year old
      now,
    );

    expect(aging).toEqual({ score: 50, label: "Aging" });
    expect(stale).toEqual({ score: 0, label: "Stale" });
  });

  it("never goes below zero for very old assets", () => {
    const freshness = computeFreshness(
      { publishedAt: "2020-01-01T00:00:00.000Z" },
      now,
    );

    expect(freshness?.score).toBe(0);
  });

  it("returns null when no date is parseable (pre-governance documents)", () => {
    expect(computeFreshness({}, now)).toBeNull();
    expect(computeFreshness({ publishedAt: "not-a-date" }, now)).toBeNull();
  });
});
