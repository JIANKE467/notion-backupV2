import fs from "fs"; import path from "path"; import createCsvWriter from "csv-writer"; import { richTextToPlain } from "./util.js";

export async function processDatabase(notionClient, databaseId, opts = {}) { const outDir = opts.outDir || path.join("backup", "databases", databaseId); const downloadAssets = !!opts.downloadAssets; const assetsDir = opts.assetsDir || path.join(outDir, "assets");

fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(assetsDir, { recursive: true });

// fetch all rows let rows = []; let cursor = undefined; while (true) { const res = await notionClient.queryDatabase(databaseId, cursor); rows.push(...res.results); if (!res.has_more) break; cursor = res.next_cursor; }

if (rows.length === 0) { fs.writeFileSync(path.join(outDir, "README.md"), "No rows\n"); return; }

// build headers const first = rows[0]; const headers = Object.keys(first.properties || {});

// Markdown table let md = # Database ${databaseId}\n\n; md += | ${headers.join(" | ")} |\n; md += | ${headers.map(() => "---").join(" | ")} |\n;

const csvWriter = createCsvWriter.createObjectCsvWriter({ path: path.join(outDir, "rows.csv"), header: headers.map(h => ({ id: h, title: h })) });

const csvRecords = [];

for (const r of rows) { const values = headers.map(h => { const cell = r.properties[h]; if (!cell) return ""; switch (cell.type) { case "title": return (cell.title || []).map(t => t.plain_text).join(""); case "rich_text": return (cell.rich_text || []).map(t => t.plain_text).join(""); case "number": return cell.number === null ? "" : String(cell.number); case "select": return cell.select ? cell.select.name : ""; case "multi_select": return (cell.multi_select || []).map(s => s.name).join(","); case "checkbox": return cell.checkbox ? "TRUE" : "FALSE"; case "date": return cell.date ? (cell.date.start || "") : ""; case "files": // download files if ((cell.files || []).length > 0) { const names = []; for (const f of cell.files) { const url = f.external?.url || f.file?.url; const ext = path.extname(new URL(url).pathname) || ""; const name = file_${f.name || f.file?.expiry_time || f.id}${ext}; const dest = path.join(assetsDir, name); if (downloadAssets) { try { await opts.downloader.download(url, dest); } catch (e) { console.warn('file download failed', e.message); } } names.push(name); } return names.join(","); } return ""; case "people": return (cell.people || []).map(p => p.name || p.id).join(","); default: return ""; } });

md += `| ${values.join(" | ")} |\n`;

const rec = {};
headers.forEach((h, idx) => rec[h] = values[idx]);
csvRecords.push(rec);

}

fs.writeFileSync(path.join(outDir, "rows.md"), md, "utf8"); await csvWriter.writeRecords(csvRecords); }