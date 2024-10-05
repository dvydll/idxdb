// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/__e2e__',
	// Configura el navegador, tiempo de espera, etc.
	use: {
		headless: true,
		// viewport: { width: 1280, height: 720 },
		// Otros parámetros de configuración según sea necesario
	},
});
