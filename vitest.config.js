/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom', // Para simular el entorno del navegador
		include: ['**/__tests__/**/*.test.js'],
		exclude: ['**/e2e/**'],
	},
});
