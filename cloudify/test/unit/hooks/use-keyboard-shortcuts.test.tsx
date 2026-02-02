import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

describe("useKeyboardShortcuts hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners
  });

  // Helper to simulate keydown
  function fireKeydown(
    key: string,
    options: Partial<KeyboardEventInit> = {}
  ) {
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      ...options,
    });
    document.dispatchEvent(event);
    return event;
  }

  // Test 68: executes action when shortcut key pressed
  it("executes action when shortcut key pressed", () => {
    const action = vi.fn();
    const shortcuts = [
      { key: "g", action, description: "Test shortcut" },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    fireKeydown("g");

    expect(action).toHaveBeenCalled();
  });

  // Test 69: respects meta key modifier
  it("respects meta key modifier", () => {
    const actionWithMeta = vi.fn();
    const actionWithoutMeta = vi.fn();
    const shortcuts = [
      { key: "n", meta: true, action: actionWithMeta, description: "With meta" },
      { key: "m", action: actionWithoutMeta, description: "Without meta" },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Press n without meta - should not trigger
    fireKeydown("n", { metaKey: false });
    expect(actionWithMeta).not.toHaveBeenCalled();

    // Press n with meta - should trigger
    fireKeydown("n", { metaKey: true });
    expect(actionWithMeta).toHaveBeenCalled();

    // Press m without meta - should trigger
    fireKeydown("m", { metaKey: false });
    expect(actionWithoutMeta).toHaveBeenCalled();
  });

  // Test 70: respects shift key modifier
  it("respects shift key modifier", () => {
    const action = vi.fn();
    const shortcuts = [
      { key: "?", shift: true, action, description: "Shift shortcut" },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Press ? without shift - should not trigger
    fireKeydown("?", { shiftKey: false });
    expect(action).not.toHaveBeenCalled();

    // Press ? with shift - should trigger
    fireKeydown("?", { shiftKey: true });
    expect(action).toHaveBeenCalled();
  });

  // Test 71: ignores shortcuts when typing in input
  it("ignores shortcuts when typing in input", () => {
    const action = vi.fn();
    const shortcuts = [{ key: "g", action, description: "Go somewhere" }];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Create an input and focus it
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    // Dispatch event on the input
    const event = new KeyboardEvent("keydown", {
      key: "g",
      bubbles: true,
    });
    Object.defineProperty(event, "target", { value: input });
    document.dispatchEvent(event);

    expect(action).not.toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(input);
  });

  // Test 72: ignores shortcuts when typing in textarea
  it("ignores shortcuts when typing in textarea", () => {
    const action = vi.fn();
    const shortcuts = [{ key: "p", action, description: "Go to projects" }];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Create a textarea and focus it
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();

    const event = new KeyboardEvent("keydown", {
      key: "p",
      bubbles: true,
    });
    Object.defineProperty(event, "target", { value: textarea });
    document.dispatchEvent(event);

    expect(action).not.toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(textarea);
  });

  // Test 73: prevents default event behavior
  it("prevents default event behavior", () => {
    const action = vi.fn();
    const shortcuts = [
      { key: "s", meta: true, action, description: "Save" },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent("keydown", {
      key: "s",
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(action).toHaveBeenCalled();
  });
});
