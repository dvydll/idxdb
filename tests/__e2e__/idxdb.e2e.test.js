import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const libPath = path.join(__dirname, '../../src/index.js');

test.describe('IdxDB E2E tests', () => {
	test('should initialize IdxDB correctly', async ({ page }) => {
		// Inyectar el script de tu biblioteca en la página
		await page.addScriptTag({ path: libPath, type: 'module' });

		// Ejecutar la función para inicializar IdxDB y verificar
		const initResult = await page.evaluate(async () => {
			// eslint-disable-next-line no-undef
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
