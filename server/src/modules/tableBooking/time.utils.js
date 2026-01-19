// Small time helpers for HH:mm strings
export function toMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map((s) => parseInt(s, 10));
  return h * 60 + m;
}

export function toTimeString(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function overlaps(startA, endA, startB, endB) {
  const a0 = toMinutes(startA);
  const a1 = toMinutes(endA);
  const b0 = toMinutes(startB);
  const b1 = toMinutes(endB);
  return a0 < b1 && b0 < a1;
}

// Add minutes to a HH:mm time string
export function addMinutes(timeStr, minutes) {
  const totalMinutes = toMinutes(timeStr) + minutes;
  // Handle day overflow (though we don't actually add day here)
  return toTimeString(totalMinutes % (24 * 60));
}

// Calculate duration in minutes between two HH:mm times
export function getDurationMinutes(startTime, endTime) {
  return toMinutes(endTime) - toMinutes(startTime);
}
