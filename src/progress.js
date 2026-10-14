export const SAVE_KEY = 'floraverse.bloom-story.v1';
export const freshProgress = () => ({ scanned: [], barriers: [], soils: [], ritual: false, reflection: false, position: null });
export function sanitizeProgress(value) {
  const p = freshProgress();
  if (Array.isArray(value?.position) && value.position.length === 2 && value.position.every(Number.isFinite)) p.position = value.position;
  for (const key of ['scanned', 'barriers', 'soils']) {
    p[key] = [...new Set(Array.isArray(value?.[key]) ? value[key] : [])].filter(x => Number.isInteger(x) && x >= 0 && x < (key === 'barriers' ? 2 : 3));
  }
  if (p.scanned.length !== 3) { p.barriers = []; return p; }
  if (p.barriers.length !== 2) { p.soils = []; return p; }
  if (p.soils.length === 3) p.ritual = value?.ritual === true;
  p.reflection = p.ritual && value?.reflection === true;
  return p;
}
export function progressPercent(p) {
  return Math.round(p.scanned.length / 3 * 20 + p.barriers.length / 2 * 20 + p.soils.length / 3 * 20 + (p.ritual ? 20 : 0) + (p.reflection ? 20 : 0));
}
export function stageOf(p) {
  if (p.scanned.length < 3) return 'survey';
  if (p.barriers.length < 2) return 'isolate';
  if (p.soils.length < 3) return 'soil';
  if (!p.ritual) return 'ritual';
  return p.reflection ? 'complete' : 'reflect';
}
export function canUnlock(previous) { return previous.ritual && progressPercent(previous) >= 80; }
export function loadProgress(storage) {
  try { return sanitizeProgress(JSON.parse(storage.getItem(SAVE_KEY))?.progress); } catch { return freshProgress(); }
}
export function saveProgress(storage, progress) {
  try { storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, progress })); return true; } catch { return false; }
}
