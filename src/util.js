import fs from "fs-extra";
import path from "path";
import yaml from "yaml";

export function loadConfig(baseDir) {
  const configPath = path.join(baseDir, "..", "config.yml");
  const raw = fs.readFileSync(configPath, "utf8");
  const config = yaml.parse(raw);

  const OUTPUT_DIR = path.join(baseDir, "..", config.output_dir || "backup");
  const PAGES_DIR = path.join(OUTPUT_DIR, "pages");
  const ASSETS_DIR = path.join(OUTPUT_DIR, "assets");

  fs.ensureDirSync(OUTPUT_DIR);

  return {
    OUTPUT_DIR,
    PAGES_DIR,
    ASSETS_DIR,
    CONFIG: config,
    DOWNLOAD_ASSETS: config.download_assets ?? true,
    PER_PAGE_IMAGES: config.per_page_images ?? false
  };
}

export function extFromUrl(url) {
  const m = url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?|$)/i);
  return m ? "." + m[1] : null;
}

export function renderRichText(rich) {
  if (!rich || !rich.length) return "";
  return rich.map(t => t.plain_text || "").join("");
}