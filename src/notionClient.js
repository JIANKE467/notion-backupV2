import { Client } from "@notionhq/client";

export function getNotionClient(token) {
  if (!token) throw new Error("NOTION_API_TOKEN is missing.");
  return new Client({ auth: token });
}