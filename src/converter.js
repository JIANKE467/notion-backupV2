import path from "path";
import fs from "fs-extra";
import { extFromUrl, renderRichText } from "./util.js";

export async function pageToMarkdown(notion, pageId, opts) {
  const {
    downloadAssets,
    pageDir,
    assetsDir,
    perPageImages,
    downloader
  } = opts;

  const blocks = await getBlocks(notion, pageId);
  let md = "";

  for (const block of blocks) {
    const t = block.type;
    const b = block[t];

    switch (t) {
      case "paragraph":
        md += renderRichText(b.rich_text) + "\n\n";
        break;

      case "heading_1":
        md += `# ${renderRichText(b.rich_text)}\n\n`;
        break;

      case "heading_2":
        md += `## ${renderRichText(b.rich_text)}\n\n`;
        break;

      case "heading_3":
        md += `### ${renderRichText(b.rich_text)}\n\n`;
        break;

      case "bulleted_list_item":
        md += `- ${renderRichText(b.rich_text)}\n`;
        break;

      case "numbered_list_item":
        md += `1. ${renderRichText(b.rich_text)}\n`;
        break;

      case "to_do":
        md += `- [${b.checked ? "x" : " "}] ${renderRichText(b.rich_text)}\n`;
        break;

      case "quote":
        md += `> ${renderRichText(b.rich_text)}\n\n`;
        break;

      case "code":
        md += `\`\`\`${b.language || ""}\n${renderRichText(b.rich_text)}\n\`\`\`\n\n`;
        break;

      case "divider":
        md += `---\n\n`;
        break;

      case "image": {
        const url = b.type === "external" ? b.external.url : b.file.url;
        const ext = extFromUrl(url) || ".jpg";
        const name = `img_${block.id}${ext}`;

        const relDir = perPageImages ? "images" : assetsDir;
        const dirPath = perPageImages
          ? path.join(pageDir, relDir)
          : assetsDir;

        fs.ensureDirSync(dirPath);

        const dest = path.join(dirPath, name);

        if (downloadAssets) {
          try {
            await downloader.download(url, dest);
          } catch (e) {
            console.warn(`Image download failed: ${url} -> ${dest}`, e.message);
          }
        }

        const mdPath = perPageImages
          ? `./${relDir}/${name}`
          : `./${path.relative(pageDir, dest)}`;

        md += `![image](${mdPath})\n\n`;
        break;
      }

      case "child_page":
        md += `\n[Child page: ${b.title}](./${b.title}.md)\n\n`;
        break;

      default:
        // unsupported types omitted
        break;
    }
  }

  return md;
}

async function getBlocks(notion, pageId) {
  let results = [];
  let cursor = undefined;

  while (true) {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor
    });

    results = results.concat(res.results);
    if (!res.has_more) break;
    cursor = res.next_cursor;
  }

  return results;
}