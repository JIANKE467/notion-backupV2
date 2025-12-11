import fs from "fs-extra";
import axios from "axios";

export class Downloader {
  constructor(token) {
    this.token = token;
  }

  async download(url, dest) {
    try {
      const response = await axios({
        url,
        method: "GET",
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Notion-Version": "2022-06-28"
        }
      });

      await fs.ensureDir(fs.dirname(dest));
      await fs.writeFile(dest, response.data);
      console.log("✔ Image saved:", dest);
    } catch (err) {
      console.warn("❌ Image download failed:", url, "\nError:", err.message);
    }
  }
}