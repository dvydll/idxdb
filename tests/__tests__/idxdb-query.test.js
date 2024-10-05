// idxdb-query.test.js
import { indexedDB } from 'fake-indexeddb';
import { beforeAll, describe, expect, it } from 'vitest';
import { IdxDBQuery } from '../../src/index.js';

describe('IdxDBQuery', () => {
	let db, idxDBQuery;
	const data = [
		{ id: 1, name: 'Test 1', description: 'This is the test 1 description.' },
		{ id: 2, name: 'Test 2', description: 'This is the test 2 description.' },
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

		// Asignar la instancia de tu librería para las pruebas de IdxDBQuery
		idxDBQuery = new IdxDBQuery(db);
	});

	describe('constructor', () => {
		it('should create an instance of IdxDBQuery', () => {
			const instance = new IdxDBQuery(db);
			expect(instance).toBeInstanceOf(IdxDBQuery);
		});
	});

	describe('get', () => {
		it('should throw error if object store does not exist', async () => {
			await expect(
				idxDBQuery.get({ key: null }, { store: 'nonExistentStore' })
			).rejects.toThrow(/El objecStore nonExistentStore no existe\./);
		});

		it('should successfully get all data', async () => {
			const result = await idxDBQuery.get(null, { store: 'testStore' });
			expect(result).toHaveLength(2);
			expect(result).toEqual(data);
		});

		it('should successfully get undefined if key does not exist', async () => {
			const result = await idxDBQuery.get(99, { store: 'testStore' });
			expect(result).toBeUndefined();
		});

		it('should successfully get data by existing key', async () => {
			const result = await idxDBQuery.get(1, { store: 'testStore' });
			expect(result).toEqual(data[0]);
		});

		it('should successfully get undefined if indexed property value not exist', async () => {
			const result = await idxDBQuery.get(
				{ name: 'Not exist' },
				{ store: 'testStore' }
			);
			expect(result).toBeUndefined();
		});

		it('should throw error if get data by not indexed property', async () => {
			await expect(
				idxDBQuery.get(
					{ description: 'This is the test 2 description.' },
					{ store: 'testStore' }
				)
			).rejects.toThrow();
		});

		it('should successfully get data by indexed property', async () => {
			const result = await idxDBQuery.get(
				{ name: 'Test 1' },
				{ store: 'testStore' }
			);
			expect(result).toEqual(data[0]);
		});
	});

	describe('cursor', () => {
		it('should throw error if object store does not exist', async () => {
			await expect(
				idxDBQuery.cursor((record) => record, null, {
					store: 'nonExistentStore',
				})
			).rejects.toThrow(/El objecStore nonExistentStore no existe\./);
		});

		it('should successfully iterate all existing data', async () => {
			let i = 0;
			await idxDBQuery.cursor(
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
			await idxDBQuery.cursor((record) => results.push(record), null, {
				store: 'testStore',
			});
			expect(results).toStrictEqual(data);
		});

		it('should successfully get existing data', async () => {
			const result = await idxDBQuery.cursor((record) => record, null, {
				store: 'testStore',
			});
			expect(result).toStrictEqual(data.at(-1));
		});
	});
});
