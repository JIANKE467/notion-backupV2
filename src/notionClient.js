import { Client } from "@notionhq/client";

export class NotionClient { constructor(opts) { this.client = new Client(opts); }

async search(opts = {}) { return this.client.search(opts); }

async retrievePage(pageId) { return this.client.pages.retrieve({ page_id: pageId }); }

async getBlockChildren(blockId, start_cursor = undefined) { return this.client.blocks.children.list({ block_id: blockId, start_cursor }); }

async queryDatabase(database_id, start_cursor = undefined) { return this.client.databases.query({ database_id, start_cursor, page_size: 100 }); } }