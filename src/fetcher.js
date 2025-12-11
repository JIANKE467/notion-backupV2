import fs from "fs"; import path from "path"; import fetch from "node-fetch"; import pLimit from "p-limit";

const limiters = new Map();

export function makeDownloader(concurrency = 4) { const limit = pLimit(concurrency);

async function download(url, dest) { return limit(async () => { // skip if exists if (fs.existsSync(dest)) return dest; const res = await fetch(url); if (!res.ok) throw new Error(failed to download ${url}: ${res.status}); const buffer = await res.arrayBuffer(); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, Buffer.from(buffer)); return dest; }); }

return { download }; }