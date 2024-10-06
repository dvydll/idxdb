// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/__e2e__',
	use: { headless: true },
});
