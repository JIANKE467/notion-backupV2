import sanitize from "sanitize-filename"; import path from "path";

export function safeName(name) { if (!name) return "untitled"; const s = name.replace(/\n/g, " ").trim(); const san = sanitize(s) || "untitled"; return san; }

export function extFromUrl(url) { try { const p = new URL(url).pathname; const ext = path.extname(p) || ""; return ext || ""; } catch (e) { return ""; } }

export function richTextToPlain(rtArray = []) { return rtArray.map(rt => rt.plain_text || "").join(""); }
