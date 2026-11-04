// Serves the repo root with Python's static server and runs the specs in Chromium.
// Set CHROMIUM_PATH to use an already installed Chromium instead of `npx playwright install chromium`.
const { defineConfig } = require('@playwright/test');
const path = require('path');

const PORT = 8777;
module.exports = defineConfig({
  testDir: './specs',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1400, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    cwd: path.join(__dirname, '..'),
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
  },
});
