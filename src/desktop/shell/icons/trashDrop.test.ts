import { describe, it, expect } from 'vitest';
import { isPointerOverTrash } from './trashDrop';

const HIT_PADDING_PX = 12;

function makeTrashEl(rect: {
  left: number;
  right: number;
  top: number;
  bottom: number;
}): HTMLElement {
  const fullRect: DOMRect = {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  };
  return {
    getBoundingClientRect: () => fullRect,
  } as unknown as HTMLElement;
}

describe('isPointerOverTrash', () => {
  it('returns false when the element is null', () => {
    expect(isPointerOverTrash(50, 50, null)).toBe(false);
  });

  it('returns true for a point well inside the rect', () => {
    const el = makeTrashEl({ left: 100, right: 200, top: 100, bottom: 200 });
    expect(isPointerOverTrash(150, 150, el)).toBe(true);
  });

  it('returns true for a point exactly on the rect edges', () => {
    const el = makeTrashEl({ left: 100, right: 200, top: 100, bottom: 200 });
    expect(isPointerOverTrash(100, 100, el)).toBe(true); // top-left corner
    expect(isPointerOverTrash(200, 200, el)).toBe(true); // bottom-right corner
    expect(isPointerOverTrash(100, 200, el)).toBe(true); // bottom-left corner
    expect(isPointerOverTrash(200, 100, el)).toBe(true); // top-right corner
  });

  it('returns true within the hit padding outside the rect', () => {
    const el = makeTrashEl({ left: 100, right: 200, top: 100, bottom: 200 });
    // left padding edge
    expect(isPointerOverTrash(100 - HIT_PADDING_PX, 150, el)).toBe(true);
    // right padding edge
    expect(isPointerOverTrash(200 + HIT_PADDING_PX, 150, el)).toBe(true);
    // top padding edge
    expect(isPointerOverTrash(150, 100 - HIT_PADDING_PX, el)).toBe(true);
    // bottom padding edge
    expect(isPointerOverTrash(150, 200 + HIT_PADDING_PX, el)).toBe(true);
  });

  it('returns false just beyond the hit padding on each side', () => {
    const el = makeTrashEl({ left: 100, right: 200, top: 100, bottom: 200 });
    // just left of left padding
    expect(isPointerOverTrash(100 - HIT_PADDING_PX - 1, 150, el)).toBe(false);
    // just right of right padding
    expect(isPointerOverTrash(200 + HIT_PADDING_PX + 1, 150, el)).toBe(false);
    // just above top padding
    expect(isPointerOverTrash(150, 100 - HIT_PADDING_PX - 1, el)).toBe(false);
    // just below bottom padding
    expect(isPointerOverTrash(150, 200 + HIT_PADDING_PX + 1, el)).toBe(false);
  });

  it('returns false for a point far away from the rect', () => {
    const el = makeTrashEl({ left: 100, right: 200, top: 100, bottom: 200 });
    expect(isPointerOverTrash(0, 0, el)).toBe(false);
    expect(isPointerOverTrash(1000, 1000, el)).toBe(false);
  });

  it('requires both axes to be within bounds (in-x but out-of-y)', () => {
    const el = makeTrashEl({ left: 100, right: 200, top: 100, bottom: 200 });
    // x inside, y far below
    expect(isPointerOverTrash(150, 500, el)).toBe(false);
    // y inside, x far right
    expect(isPointerOverTrash(500, 150, el)).toBe(false);
  });

  it('handles a zero-area (collapsed) rect, hit only via padding', () => {
    const el = makeTrashEl({ left: 50, right: 50, top: 50, bottom: 50 });
    expect(isPointerOverTrash(50, 50, el)).toBe(true);
    expect(isPointerOverTrash(50 + HIT_PADDING_PX, 50, el)).toBe(true);
    expect(isPointerOverTrash(50 + HIT_PADDING_PX + 1, 50, el)).toBe(false);
  });

  it('handles negative-offset rects (scrolled/off-screen positions)', () => {
    const el = makeTrashEl({ left: -50, right: 0, top: -50, bottom: 0 });
    expect(isPointerOverTrash(-25, -25, el)).toBe(true);
    expect(isPointerOverTrash(0 + HIT_PADDING_PX, -25, el)).toBe(true);
    expect(isPointerOverTrash(0 + HIT_PADDING_PX + 1, -25, el)).toBe(false);
  });
});
