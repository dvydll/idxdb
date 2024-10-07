import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IdxDB } from "../../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlFilePath = path.join(__dirname, 'test.html'); // Ruta al archivo HTML

test.describe('IdxDB E2E tests', () => {
	test('should initialize IdxDB correctly', async ({ page }) => {
		// Cargar el archivo HTML
		await page.goto(`file://${htmlFilePath}`);

    await page.addInitScript(() => {
      window.IdxDB = IdxDB;
    })

		// Ejecutar la función para inicializar IdxDB y verificar
		const initResult = await page.evaluate(async () => {
			const idxdb = await IdxDB.init({
				name: 'testDB',
				version: 1,
				stores: ['testStore', 'otherTestStore'],
			});

			return idxdb.dbInfo; // Devuelve la información de la base de datos
		});

		expect(initResult).toEqual({
			name: 'testDB',
			version: 1,
			stores: ['testStore', 'otherTestStore'],
		});
	});
});
