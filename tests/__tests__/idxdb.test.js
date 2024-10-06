// idxdb-command.test.js
import { indexedDB } from 'fake-indexeddb';
import { beforeAll, describe, expect, it } from 'vitest';
import {
	IdxDB,
	OBJECT_STORE_OPTIONS,
	TRANSACTION_TYPES,
} from '../../src/index.js';

describe('IdxDB', () => {
	let db;
	/**
	 * @type {IdxDB}
	 */
	let idxDB;
	const data = [
		{ id: 1, name: 'Test 1' },
		{ id: 2, name: 'Test 2' },
	];

	beforeAll(async () => {
		const openRequest = indexedDB.open('testDB', 1);
		db = await new Promise((resolve, reject) => {
			openRequest.onupgradeneeded = (event) => {
				const db = event.target.result;
				const objectStore = db.createObjectStore(
					'testStore',
					OBJECT_STORE_OPTIONS.keyPath('id')
				);
				const otherObjectStore = db.createObjectStore(
					'otherTestStore',
					OBJECT_STORE_OPTIONS.autoIncrement()
				);
				objectStore.createIndex(
					'name',
					'name',
					OBJECT_STORE_OPTIONS.unique(false)
				);
				otherObjectStore.createIndex(
					'name',
					'name',
					OBJECT_STORE_OPTIONS.unique()
				);
			};

			openRequest.onsuccess = (event) => resolve(event.target.result);
			openRequest.onerror = (event) => reject(event.target.error);
		});

		// Iniciar una transacción de lectura y escritura
		const tx = db.transaction('testStore', TRANSACTION_TYPES.readwrite);
		const objStore = tx.objectStore('testStore');

		// Iniciar otra transacción de lectura y escritura
		const otherTx = db.transaction(
			'otherTestStore',
			TRANSACTION_TYPES.readwrite
		);
		const otherObjStore = otherTx.objectStore('otherTestStore');

		// Añadir los datos de ejemplo al store
		await Promise.all(
			data.map(
				(item) =>
					new Promise((resolve, reject) => {
						const [dbReq, otherDbReq] = [
							objStore.add(item),
							otherObjStore.add(item),
						];
						[dbReq.onsuccess, otherDbReq.onsuccess] = Array.from({
							length: 2,
						}).fill(() => resolve(item));
						[dbReq.onerror, otherDbReq.onerror] = Array.from({
							length: 2,
						}).fill((event) => reject(event.target.error));
					})
			)
		);

		// Asignar la instancia de tu librería para las pruebas de IdxDB
		idxDB = new IdxDB(db);
	});

	describe('constructor', () => {
		it('should create an instance of IdxDB', () => {
			const instance = new IdxDB(db);
			expect(instance).toBeInstanceOf(IdxDB);
		});
	});

	describe('dbInfo', () => {
		it('should return the database information', () => {
			expect(idxDB.dbInfo).toEqual({
				name: 'testDB',
				version: 1,
				stores: ['testStore', 'otherTestStore'],
			});
		});
	});

	describe('get', () => {
		it('should throw error if object store does not exist', async () => {
			await expect(
				idxDB.get({ key: null }, { store: 'nonExistentStore' })
			).rejects.toThrow(/El objecStore nonExistentStore no existe\./);
		});

		it('should successfully get all data', async () => {
			const result = await idxDB.get(null, { store: 'testStore' });
			expect(result).toHaveLength(2);
			expect(result).toEqual(data);
		});

		it('should successfully get undefined if key does not exist', async () => {
			const result = await idxDB.get(99, { store: 'testStore' });
			expect(result).toBeUndefined();
		});

		it('should successfully get data by existing key', async () => {
			const result = await idxDB.get(1, { store: 'testStore' });
			expect(result).toEqual(data[0]);
		});

		it('should successfully get undefined if indexed property value not exist', async () => {
			const result = await idxDB.get(
				{ name: 'Not exist' },
				{ store: 'testStore' }
			);
			expect(result).toBeUndefined();
		});

		it('should throw error if get data by not indexed property', async () => {
			await expect(
				idxDB.get(
					{ description: 'This is the test 2 description.' },
					{ store: 'testStore' }
				)
			).rejects.toThrow();
		});

		it('should successfully get data by indexed property', async () => {
			const result = await idxDB.get(
				{ name: 'Test 1' },
				{ store: 'testStore' }
			);
			expect(result).toEqual(data[0]);
		});
	});

	describe('cursor', () => {
		it('should throw error if object store does not exist', async () => {
			await expect(
				idxDB.cursor((record) => record, null, {
					store: 'nonExistentStore',
				})
			).rejects.toThrow(/El objecStore nonExistentStore no existe\./);
		});

		it('should successfully iterate all existing data', async () => {
			let i = 0;
			await idxDB.cursor(
				(record) => {
					expect(record).toStrictEqual(data.at(i));
					i++;
				},
				null,
				{
					store: 'testStore',
				}
			);
		});

		it('should successfully get all existing data', async () => {
			const results = [];
			await idxDB.cursor((record) => results.push(record), null, {
				store: 'testStore',
			});
			expect(results).toStrictEqual(data);
		});

		it('should successfully get existing data', async () => {
			const result = await idxDB.cursor((record) => record, null, {
				store: 'testStore',
			});
			expect(result).toStrictEqual(data.at(-1));
		});
	});

	describe('create', () => {
		it('should throw error if object store does not exist', async () => {
			await expect(
				idxDB.create([], { store: 'nonExistentStore' })
			).rejects.toThrow(/El objecStore nonExistentStore no existe\./);
		});

		it('should throw error if no data is provided', async () => {
			await expect(idxDB.create([], { store: 'testStore' })).rejects.toThrow(
				/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[ERROR\] No hay datos para guardar/
			);
		});

		it('should throw error if duplicate item is added', async () => {
			await expect(
				idxDB.create({ id: 1, name: 'Test 1' }, { store: 'testStore' })
			).rejects.toThrow();
		});

		it('should successfully add data', async () => {
			const data = [
				{ id: 3, name: 'Test 3' },
				{ id: 4, name: 'Test 4' },
			];
			const result = await idxDB.create(data, { store: 'testStore' });
			expect(result).toEqual(data);
		});
	});

	describe('update', () => {
		it('should throw error if object store does not exist', async () => {
			await expect(
				idxDB.update({ data: {}, key: 1 }, { store: 'nonExistentStore' })
			).rejects.toThrow(/El objecStore nonExistentStore no existe/);
		});

		it('should throw error if defines keyPath and provides key', async () => {
			const updatedData = { id: 3, name: 'Updated Test 3' };
			await expect(
				idxDB.update(
					{ data: updatedData, key: updatedData.id },
					{ store: 'testStore' }
				)
			).rejects.toThrow();
		});

		it('should successfully update existing data', async () => {
			const updatedData = { id: 1, name: 'Updated Test 1' };
			const result = await idxDB.update(
				{ data: updatedData },
				{ store: 'testStore' }
			);
			expect(result).toBe(updatedData.id);
		});
	});

	describe('delete', () => {
		it('should throw error if object store does not exist', async () => {
			await expect(
				idxDB.delete(1, { store: 'nonExistentStore' })
			).rejects.toThrow(/El objecStore nonExistentStore no existe/);
		});

		it('should throw error if key is not specified', async () => {
			await expect(idxDB.delete(null, { store: 'testStore' })).rejects.toThrow(
				/No se especifico la clave para eliminar/
			);
		});

		it('should successfully delete data', async () => {
			expect(await idxDB.delete(1, { store: 'testStore' })).toBeUndefined();
		});
	});
});
