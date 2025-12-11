export async function searchAll(notion) {
  let results = [];
  let cursor = undefined;

  while (true) {
    const res = await notion.search({
      start_cursor: cursor,
      page_size: 100
    });

    results = results.concat(
      res.results.filter(item => item.object === "page")
    );

    if (!res.has_more) break;
    cursor = res.next_cursor;
  }

  return results;
}