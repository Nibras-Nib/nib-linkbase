/**
 * Normalizes a typed username into a handle: trimmed, lowercase, and limited to
 * `a-z 0-9 . _` (the design's rule). Server-side handle rules are TBD.
 */
export function normalizeHandle(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
}
