// localStorage in a hostile environment (private browsing, quota full, a
// borrowed machine at the meeting) throws on write. The demo must degrade to
// in-memory rather than break a mutation half-way, so every write goes
// through these guards. Reads already fall back to defaults at each call site.
export function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable — the in-memory state is still authoritative for
    // this session; persistence is best-effort.
  }
}

export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore — nothing to clean up if storage is unavailable
  }
}
