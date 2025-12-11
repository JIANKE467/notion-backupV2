import fs from "fs"; import path from "path"; import yaml from "js-yaml"; import { NotionClient } from "./notionClient.js"; import { makeDownloader } from "./fetcher.js"; import { pageToMarkdown } from "./converter.js"; import { processDatabase } from "./dbHandler.js"; import { safeName } from "./util.js";

// load config const cfg = yaml.load(fs.readFileSync(path.resolve("./config.yml"), "utf8"));

const OUTPUT_DIR = path.resolve(cfg.options.output_dir || "./backup"); const PAGES_DIR = path.join(OUTPUT_DIR, "pages"); const DBS_DIR = path.join(OUTPUT_DIR, "databases"); const ASSETS_DIR = path.join(OUTPUT_DIR, cfg.options.assets_dir || "assets"); const CONCURRENCY = process.env.MAX_CONCURRENCY ? Number(process.env.MAX_CONCURRENCY) : (cfg.options.concurrency || 6); const DOWNLOAD_ASSETS = Boolean(cfg.options.download_assets); const PER_PAGE_IMAGES = Boolean(cfg.options.per_page_image_dir);

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); } ensureDir(OUTPUT_DIR); ensureDir(PAGES_DIR); ensureDir(DBS_DIR); ensureDir(ASSETS_DIR);

if (!process.env.NOTION_API_TOKEN) { console.error("ERROR: NOTION_API_TOKEN is not set. Create a GitHub secret NOTION_API_TOKEN with your integration token."); process.exit(1); }

const notion = new NotionClient({ auth: process.env.NOTION_API_TOKEN }); const downloader = makeDownloader(CONCURRENCY);

// Search entire workspace (what the integration can access) async function searchAll() { console.log("Searching workspace via Notion Search API..."); let results = []; let cursor = undefined; while (true) { const res = await notion.search({ page_size: 100, start_cursor: cursor }); results.push(...res.results); if (!res.has_more) break; cursor = res.next_cursor; }

// filter pages and databases const filtered = results.filter(r => r.object === 'page' || r.object === 'database'); const map = new Map(); for (const it of filtered) map.set(it.id, it); return Array.from(map.values()); }

async function handlePage(item) { const pageId = item.id; // try to find title (may differ depending on properties) let title = "Untitled"; if (item.properties) { const keys = Object.keys(item.properties); for (const k of keys) { const v = item.properties[k]; if (v.type === 'title' && Array.isArray(v.title) && v.title.length > 0) { title = v.title.map(t => t.plain_text).join('') || title; break; } } } const safeTitle = safeName(title) || (page-${pageId.slice(0,6)}); const pageDir = path.join(PAGES_DIR, safeTitle); ensureDir(pageDir);

console.log(Exporting page: ${title}); const md = await pageToMarkdown(notion, pageId, { downloadAssets: DOWNLOAD_ASSETS, pageDir, assetsDir: ASSETS_DIR, perPageImages: PER_PAGE_IMAGES, downloader }); fs.writeFileSync(path.join(PAGES_DIR, ${safeTitle}.md), md, 'utf8'); }

async function handleDatabase(item) { const dbId = item.id; let title = "Database"; if (item.title && item.title[0] && item.title[0].plain_text) title = item.title[0].plain_text; const safeTitle = safeName(title) || (db-${dbId.slice(0,6)}); const outDir = path.join(DBS_DIR, safeTitle); ensureDir(outDir);

console.log(Exporting database: ${title}); await processDatabase(notion, dbId, { outDir, downloadAssets: DOWNLOAD_ASSETS, assetsDir: path.join(outDir, 'assets'), downloader }); }

(async () => { try { const items = await searchAll(); const pages = items.filter(i => i.object === 'page'); const dbs = items.filter(i => i.object === 'database');

console.log(`Found ${pages.length} pages and ${dbs.length} databases (accessible to integration).`);

// sequential processing to be gentle on rate limits; concurrency controlled in downloader
for (const p of pages) {
  try { await handlePage(p); } catch (e) { console.error('page export error', e.message); }
}

for (const d of dbs) {
  try { await handleDatabase(d); } catch (e) { console.error('db export error', e.message); }
}

// generate index
const indexPath = path.join(OUTPUT_DIR, 'index.md');
const indexLines = [];
indexLines.push('# Notion Workspace Backup');
indexLines.push(`Generated: ${new Date().toISOString()}`);
indexLines.push('\n## Pages');
const pageFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.md'));
for (const pf of pageFiles) indexLines.push(`- [${pf.replace(/\.md$/, '')}](./pages/${pf})`);
indexLines.push('\n## Databases');
const dbDirs = fs.readdirSync(DBS_DIR).filter(f => fs.statSync(path.join(DBS_DIR,f)).isDirectory());
for (const d of dbDirs) indexLines.push(`- ${d}`);
fs.writeFileSync(indexPath, indexLines.join('\n'), 'utf8');

console.log('Backup completed.');

} catch (e) { console.error('Fatal error', e); process.exit(2); } })();