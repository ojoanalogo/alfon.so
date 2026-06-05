/**
 * JS-toggled state classes — the control channel between the hooks that *set*
 * these classes (gesture, drag, selection) and the hooks/CSS that *read* them.
 *
 * These names are the contract; their CSS counterparts live in
 * src/styles/components/{window,icons,settings}.css (CSS can't import TS, so the
 * literals are mirrored there — keep both sides in sync via this single source).
 */
export const STATE_CLASS = {
  /** On <body> while a window or icon drag/resize gesture is in flight. */
  windowGesturing: 'is-window-gesturing',
  /** On <body> while an icon drag is hovering the trash. */
  trashDropTarget: 'is-trash-drop-target',
  /** A window that has an explicit (user/responsive) size vs content-sized. */
  windowSized: 'is-sized',
  /** The focused window. */
  windowFocused: 'is-focused',
  /** An icon currently being dragged. */
  iconDragging: 'is-dragging',
  /** A selected icon or color swatch. */
  selected: 'is-selected',
} as const;
