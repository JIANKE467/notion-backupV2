import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { loadConfig } from "./util.js";
import { getNotionClient } from "./notionClient.js";
import { searchAll } from "./fetcher.js";
import { pageToMarkdown } from "./converter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const {
      OUTPUT_DIR,
      PAGES_DIR,
      ASSETS_DIR,
      CONFIG,
      DOWNLOAD_ASSETS,
      PER_PAGE_IMAGES
    } = loadConfig(__dirname);

    const notion = getNotionClient(process.env.NOTION_API_TOKEN);

    fs.ensureDirSync(PAGES_DIR);
    fs.ensureDirSync(ASSETS_DIR);

    console.log("🔍 Searching workspace pages...");
    const pages = await searchAll(notion);

    console.log(`📄 Found ${pages.length} pages. Starting export...`);

    for (const p of pages) {
      const pageId = p.id;
      const title =
        p.properties?.title?.title?.[0]?.plain_text ||
        p.properties?.Name?.title?.[0]?.plain_text ||
        "Untitled";

      const safeTitle = title.replace(/[\\/:*?"<>|]/g, "_");

      console.log(`➡ Exporting page: ${title}`);

      const md = await pageToMarkdown(notion, pageId, {
        downloadAssets: DOWNLOAD_ASSETS,
        pageDir: PAGES_DIR,
        assetsDir: ASSETS_DIR,
        perPageImages: PER_PAGE_IMAGES
      });

      const filePath = path.join(PAGES_DIR, `${safeTitle}.md`);
      fs.writeFileSync(filePath, md, "utf8");
    }

    console.log("✅ Backup completed!");
  } catch (err) {
    console.error("❌ Backup failed:", err);
    process.exit(1);
  }
})();