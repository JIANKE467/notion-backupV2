Notion Backup

This project backs up an entire Notion workspace (all pages and databases that the integration can access) into a GitHub repository, including downloading images and files. This template uses the official Notion SDK and GitHub Actions.

Requirements:

Node.js 18+

A Notion Integration token with access to the pages/databases you want to backup (invite the integration or grant workspace access)


Setup:

1. Copy the repository into your GitHub repo.


2. Create a repository secret NOTION_API_TOKEN containing your Notion integration token.


3. Adjust config.yml if you want different output directories or concurrency.


4. Commit and push. Run the Action or use node src/index.js locally.



Output directory: ./backup (configurable)