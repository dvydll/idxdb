// idxdb-command.test.js
import { indexedDB } from 'fake-indexeddb';
import { beforeAll, describe, expect, it } from 'vitest';
import { IdxDBCommand } from '../../src/index.js'; // Ajusta la ruta según tu estructura

describe('IdxDBCommand', () => {
	let db, idxDBCommand;
	const data = [
		{ id: 1, name: 'Test 1' },
		{ id: 2, name: 'Test 2' },
	];

	beforeAll(async () => {
		const openRequest = indexedDB.open('testDB', 1);
		db = await new Promise((resolve, reject) => {
			openRequest.onupgradeneeded = (event) => {
				const db = event.target.result;
				const objectStore = db.createObjectStore('testStore', {
					keyPath: 'id',
				});
				objectStore.createIndex('name', 'name', { unique: false });
			};

			openRequest.onsuccess = (event) => resolve(event.target.result);
			openRequest.onerror = (event) => reject(event.target.error);
		});

		// Iniciar una transacción de lectura y escritura
		const tx = db.transaction('testStore', 'readwrite');
		const objStore = tx.objectStore('testStore');

		// Añadir los datos de ejemplo al store
		await Promise.all(
			data.map(
				(item) =>
					new Promise((resolve, reject) => {
						const dbReq = objStore.add(item);
						dbReq.onsuccess = () => resolve(item);
						dbReq.onerror = (event) => reject(event.target.error);
					})
			)
		);

		// Asignar la instancia de tu librería para las pruebas de IdxDBCommand
		idxDBCommand = new IdxDBCommand(db);
	});

	describe('constructor', () => {
		it('should create an instance of IdxDBCommand', () => {
			const instance = new IdxDBCommand(db);
			expect(instance).toBeInstanceOf(IdxDBCommand);
		});
	});

	describe('create', () => {
		it('should throw error if object store does not exist', async () => {
			await expect(
				idxDBCommand.create([], { store: 'nonExistentStore' })
			).rejects.toThrow(/El objecStore nonExistentStore no existe\./);
		});

		it('should throw error if no data is provided', async () => {
			await expect(
				idxDBCommand.create([], { store: 'testStore' })
			).rejects.toThrow(
				/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[ERROR\] No hay datos para guardar/
			);
		});

		it('should throw error if duplicate item is added', async () => {
			await expect(
				idxDBCommand.create({ id: 1, name: 'Test 1' }, { store: 'testStore' })
			).rejects.toThrow();
		});

		it('should successfully add data', async () => {
			const data = [
				{ id: 3, name: 'Test 3' },
				{ id: 4, name: 'Test 4' },
			];
			const result = await idxDBCommand.create(data, { store: 'testStore' });
			expect(result).toEqual(data);
		});
	});

	describe('update', () => {
		it('should throw error if object store does not exist', async () => {
			await expect(
				idxDBCommand.update({ data: {}, key: 1 }, { store: 'nonExistentStore' })
			).rejects.toThrow(/El objecStore nonExistentStore no existe/);
		});

		it('should successfully update existing data', async () => {
			const updatedData = { id: 1, name: 'Updated Test 1' };
			const result = await idxDBCommand.update(
				{ data: updatedData, key: updatedData.id },
				{ store: 'testStore' }
			);
			expect(result).toBe(updatedData.id);
		});
	});

	describe('delete', () => {
		it('should throw error if object store does not exist', async () => {
			await expect(
				idxDBCommand.delete({ key: 1 }, { store: 'nonExistentStore' })
			).rejects.toThrow(/El objecStore nonExistentStore no existe/);
		});

		it('should throw error if key is not specified', async () => {
			await expect(
				idxDBCommand.delete({}, { store: 'testStore' })
			).rejects.toThrow(/No se especifico la clave para eliminar/);
		});

		it('should successfully delete data', async () => {
			expect(
				await idxDBCommand.delete({ key: 1 }, { store: 'testStore' })
			).toBeUndefined();
		});
	});
});
