'use client';

/**
 * Session cache for a vault's readable text (document text / image reading /
 * transcript), keyed by vault uuid.
 *
 * Two paths populate it:
 *   - Creation: the creator already holds the plaintext file, so we read it once
 *     at upload time — they can immediately ask about their own vault without
 *     having to "Access" it.
 *   - Decryption: a buyer/reader who unlocks the vault reads it client-side.
 *
 * Stored in sessionStorage (per-tab, cleared when the tab closes) plus an
 * in-memory map — decrypted content stays on the user's device for the session
 * and is never sent to our servers.
 */

const MEM = new Map<string, string>();
const key = (uuid: string) => `dv-doc-${uuid}`;

export function setDocText(uuid: string, text: string): void {
  if (!uuid || !text) return;
  MEM.set(uuid, text);
  try { sessionStorage.setItem(key(uuid), text); } catch { /* storage full / unavailable */ }
}

export function getDocText(uuid: string): string {
  if (!uuid) return '';
  const mem = MEM.get(uuid);
  if (mem) return mem;
  try {
    const v = sessionStorage.getItem(key(uuid));
    if (v) { MEM.set(uuid, v); return v; }
  } catch { /* unavailable */ }
  return '';
}
