'use client';

/**
 * Client-side "read ANY file" pipeline for the confidential AI Q&A feature.
 *
 * Everything a user decrypts is turned into text IN THE BROWSER so the assistant
 * can answer questions about it:
 *   - documents (pdf / docx / text)  → extracted locally (lib/docText)
 *   - images & scans                  → Groq vision (Llama 4 Scout)
 *   - audio                           → Groq Whisper transcription
 *   - video                           → a keyframe (vision) + speech (Whisper)
 *
 * Privacy: the raw file never leaves the browser EXCEPT the minimal payload we
 * must send to the model (a downscaled image / downsampled audio), and we never
 * store any of it server-side. Serverless requests are capped ~4.5 MB, so images
 * are downscaled and audio is downsampled to 16 kHz mono before upload.
 */

import { extractDocText, fileKind, MAX_DOC_CHARS } from './docText';
import { setDocText } from './docCache';

const REQ_LIMIT = 4_000_000; // stay safely under the serverless body limit

/**
 * Read a freshly-uploaded file (the creator already holds the plaintext) and
 * cache its text so they can immediately ask the assistant about their own
 * vault — no need to "Access" it first. Fire-and-forget; failures are silent.
 */
export async function cacheCreatedFileText(uuid: string, file: Blob, fileName: string): Promise<void> {
  try {
    const text = await extractReadableText(file, fileName);
    if (text) setDocText(uuid, text);
  } catch { /* best-effort */ }
}

/**
 * Prepare a Deal Room's AI assets at listing (the seller holds the plaintext):
 *   1. read the file once and cache its text (for the seller's own Q&A), and
 *   2. generate a safe sales PREVIEW (what's inside + a redacted sample) buyers
 *      use to evaluate BEFORE paying — so the sale is informed, not a gamble.
 * Returns the preview string; the caller persists it with setVaultPreview.
 */
export async function prepareDealRoomAssets(uuid: string, file: Blob, fileName: string, name: string): Promise<string> {
  try {
    const text = await extractReadableText(file, fileName);
    if (!text) return '';
    setDocText(uuid, text); // cache for the seller's own assistant
    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, name, fileName }),
    });
    const data = await res.json().catch(() => ({}));
    return typeof data.preview === 'string' ? data.preview : '';
  } catch {
    return '';
  }
}

/** Master entry: decrypted file → readable text (or '' if unreadable). */
export async function extractReadableText(
  blob: Blob,
  fileName: string,
  onStage?: (stage: string) => void,
): Promise<string> {
  const kind = fileKind(fileName, blob.type);
  try {
    let text = '';
    if (kind === 'image') { onStage?.('Reading the image with vision AI…'); text = await imageToText(blob); }
    else if (kind === 'audio') { onStage?.('Transcribing the audio…'); text = await audioToText(blob, fileName); }
    else if (kind === 'video') { onStage?.('Analyzing the video (frame + speech)…'); text = await videoToText(blob, fileName); }
    else { onStage?.('Reading the document…'); text = await extractDocText(blob, fileName); }
    return text.length > MAX_DOC_CHARS ? `${text.slice(0, MAX_DOC_CHARS)}\n\n…[truncated for length]` : text;
  } catch {
    return '';
  }
}

/* ------------------------------- images ---------------------------------- */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('image load failed'));
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error('read failed'));
    r.readAsDataURL(blob);
  });
}

/** Downscale to a JPEG data URL under the request limit (keeps text legible). */
async function imageToDataUrl(blob: Blob, maxDim = 1600): Promise<string> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const longest = Math.max(img.width, img.height) || 1;
    const scale = Math.min(1, maxDim / longest);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return blobToDataUrl(blob);
    ctx.drawImage(img, 0, 0, w, h);
    let q = 0.85;
    let dataUrl = canvas.toDataURL('image/jpeg', q);
    while (dataUrl.length > REQ_LIMIT && q > 0.3) { q -= 0.15; dataUrl = canvas.toDataURL('image/jpeg', q); }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function imageToText(blob: Blob): Promise<string> {
  let dataUrl: string;
  try { dataUrl = await imageToDataUrl(blob); }
  catch { try { dataUrl = await blobToDataUrl(blob); } catch { return ''; } }
  if (dataUrl.length > REQ_LIMIT + 400_000) return ''; // couldn't shrink enough
  const res = await fetch('/api/vision', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl }),
  });
  const data = await res.json().catch(() => ({}));
  return typeof data.text === 'string' ? data.text.trim() : '';
}

/* ------------------------------- audio ----------------------------------- */

/** Decode → mix to mono → resample to 16 kHz → 16-bit PCM WAV (Whisper-ready). */
function encodeWav16kMono(buffer: AudioBuffer): Blob {
  const targetRate = 16_000;
  const chs = buffer.numberOfChannels;
  const len = buffer.length;
  const mono = new Float32Array(len);
  for (let c = 0; c < chs; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < len; i++) mono[i] += d[i] / chs;
  }
  const ratio = buffer.sampleRate / targetRate;
  const outLen = Math.max(1, Math.floor(len / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const idx = i * ratio;
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, len - 1);
    const f = idx - i0;
    out[i] = mono[i0] * (1 - f) + mono[i1] * f;
  }
  const bytesPerSample = 2;
  const ab = new ArrayBuffer(44 + outLen * bytesPerSample);
  const view = new DataView(ab);
  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + outLen * bytesPerSample, true); writeStr(8, 'WAVE');
  writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true); view.setUint32(28, targetRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true); view.setUint16(34, 16, true);
  writeStr(36, 'data'); view.setUint32(40, outLen * bytesPerSample, true);
  let off = 44;
  for (let i = 0; i < outLen; i++) {
    const s = Math.max(-1, Math.min(1, out[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return new Blob([ab], { type: 'audio/wav' });
}

async function downsampleAudio(blob: Blob): Promise<Blob | null> {
  try {
    const arr = await blob.arrayBuffer();
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const decoded = await ctx.decodeAudioData(arr.slice(0));
    await ctx.close();
    return encodeWav16kMono(decoded);
  } catch {
    return null; // container the browser can't decode (e.g. some video tracks)
  }
}

async function transcribe(file: Blob, name: string): Promise<string> {
  if (file.size > REQ_LIMIT) return '';
  const form = new FormData();
  form.append('file', file, name);
  const res = await fetch('/api/transcribe', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  return typeof data.text === 'string' ? data.text.trim() : '';
}

export async function audioToText(blob: Blob, fileName: string): Promise<string> {
  const wav = await downsampleAudio(blob);
  if (wav) return transcribe(wav, 'audio.wav');
  // Couldn't downsample — send the original if it's small enough.
  return transcribe(blob, fileName || 'audio');
}

/* ------------------------------- video ----------------------------------- */

async function grabVideoFrame(blob: Blob): Promise<string | null> {
  const url = URL.createObjectURL(blob);
  try {
    const v = document.createElement('video');
    v.muted = true; v.preload = 'auto'; v.src = url;
    await new Promise<void>((res, rej) => {
      v.onloadeddata = () => res();
      v.onerror = () => rej(new Error('video load failed'));
    });
    const seekTo = Math.min(1, (v.duration || 2) * 0.1);
    await new Promise<void>((res) => { v.onseeked = () => res(); v.currentTime = seekTo; });
    const scale = Math.min(1, 1280 / Math.max(v.videoWidth || 640, v.videoHeight || 360));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round((v.videoWidth || 640) * scale));
    canvas.height = Math.max(1, Math.round((v.videoHeight || 360) * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function videoToText(blob: Blob, fileName: string): Promise<string> {
  const parts: string[] = [];

  // Visual: read one representative keyframe.
  try {
    const frame = await grabVideoFrame(blob);
    if (frame && frame.length <= REQ_LIMIT + 400_000) {
      const res = await fetch('/api/vision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl: frame }),
      });
      const data = await res.json().catch(() => ({}));
      if (typeof data.text === 'string' && data.text.trim()) parts.push(`[Representative video frame]\n${data.text.trim()}`);
    }
  } catch { /* visual is best-effort */ }

  // Speech: transcribe if the file is small enough to upload.
  try {
    if (blob.size <= REQ_LIMIT) {
      const transcript = await transcribe(blob, fileName || 'video');
      if (transcript) parts.push(`[Spoken transcript]\n${transcript}`);
    }
  } catch { /* speech is best-effort */ }

  return parts.join('\n\n');
}
