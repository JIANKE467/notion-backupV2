import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "@notionhq/client";

import { loadConfig } from "./util.js";
import { searchAll } from "./fetcher.js";
import { pageToMarkdown } from "./converter.js";
import { Downloader } from "./downloader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const {
      OUTPUT_DIR,
      PAGES_DIR,
      ASSETS_DIR,
      download_assets,
      per_page_images
    } = loadConfig(__dirname);

    // 创建 Notion 客户端
    const notion = new Client({
      auth: process.env.NOTION_API_TOKEN
    });

    // 创建图片下载器（必须传 token）
    const downloader = new Downloader(process.env.NOTION_API_TOKEN);

    fs.ensureDirSync(PAGES_DIR);
    fs.ensureDirSync(ASSETS_DIR);

    console.log("🔍 Searching workspace pages...");
    const pages = await searchAll(notion);
    console.log(`📄 Found ${pages.length} pages.`);

    for (const p of pages) {
      const pageId = p.id;
      const title =
        p.properties?.title?.title?.[0]?.plain_text ||
        p.properties?.Name?.title?.[0]?.plain_text ||
        "Untitled";

      const safeTitle = title.replace(/[\\/:*?"<>|]/g, "_");
      console.log(`➡ Exporting page: ${title}`);

      const md = await pageToMarkdown(notion, pageId, {
        downloadAssets: download_assets,
        perPageImages: per_page_images,
        pageDir: PAGES_DIR,
        assetsDir: ASSETS_DIR,
        downloader
      });

      fs.writeFileSync(path.join(PAGES_DIR, `${safeTitle}.md`), md, "utf8");
    }

    console.log("🎉 Backup completed successfully!");
  } catch (err) {
    console.error("❌ Backup failed:", err);
    process.exit(1);
  }
})();