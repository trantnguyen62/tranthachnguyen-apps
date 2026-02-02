import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  // Test 1: cn() merges multiple class names correctly
  it("merges multiple class names correctly", () => {
    const result = cn("px-4", "py-2", "bg-blue-500");
    expect(result).toBe("px-4 py-2 bg-blue-500");
  });

  // Test 2: cn() handles conditional classes with clsx syntax
  it("handles conditional classes with clsx syntax", () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn(
      "btn",
      isActive && "btn-active",
      isDisabled && "btn-disabled"
    );
    expect(result).toBe("btn btn-active");
    expect(result).not.toContain("btn-disabled");
  });

  // Test 3: cn() resolves Tailwind class conflicts using tailwind-merge
  it("resolves Tailwind class conflicts using tailwind-merge", () => {
    // Later classes should override earlier conflicting ones
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8");

    // Background color conflict
    const bgResult = cn("bg-red-500", "bg-blue-500");
    expect(bgResult).toBe("bg-blue-500");

    // Text size conflict
    const textResult = cn("text-sm", "text-lg");
    expect(textResult).toBe("text-lg");
  });

  // Test 4: cn() returns empty string for no inputs
  it("returns empty string for no inputs", () => {
    const result = cn();
    expect(result).toBe("");

    // Also with undefined/null/false values
    const result2 = cn(undefined, null, false);
    expect(result2).toBe("");
  });
});
