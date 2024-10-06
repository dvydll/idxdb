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

	describe('TRANSACTION_TYPES', () => {
		it('should return the correct transaction types', () => {
			expect(IdxDB.TRANSACTION_TYPES).toEqual({
				readonly: 'readonly',
				readwrite: 'readwrite',
				versionchange: 'versionchange',
			});
		});
	});

	describe('OBJECT_STORE_OPTIONS', () => {
		it('should return the correct object store options', () => {
			expect(typeof IdxDB.OBJECT_STORE_OPTIONS).toBe('object');
			expect(typeof IdxDB.OBJECT_STORE_OPTIONS.autoIncrement).toBe('function');
			expect(typeof IdxDB.OBJECT_STORE_OPTIONS.keyPath).toBe('function');
			expect(typeof IdxDB.OBJECT_STORE_OPTIONS.unique).toBe('function');
			expect(typeof IdxDB.OBJECT_STORE_OPTIONS.multiEntry).toBe('function');
		});

		it('should return autoincrement correctly setted', () => {
			expect(IdxDB.OBJECT_STORE_OPTIONS.autoIncrement()).toStrictEqual({
				autoIncrement: true,
			});
			expect(IdxDB.OBJECT_STORE_OPTIONS.autoIncrement(false)).toStrictEqual({
				autoIncrement: false,
			});
		});

		it('should return keyPath set to "id"', () => {
			expect(IdxDB.OBJECT_STORE_OPTIONS.keyPath('id')).toStrictEqual({
				keyPath: 'id',
			});
		});

		it('should return unique correctly setted', () => {
			expect(IdxDB.OBJECT_STORE_OPTIONS.unique()).toStrictEqual({
				unique: true,
			});
			expect(IdxDB.OBJECT_STORE_OPTIONS.unique(false)).toStrictEqual({
				unique: false,
			});
		});

		it('should return multiEntry correctly setted', () => {
			expect(IdxDB.OBJECT_STORE_OPTIONS.multiEntry()).toStrictEqual({
				multiEntry: true,
			});
			expect(IdxDB.OBJECT_STORE_OPTIONS.multiEntry(false)).toStrictEqual({
				multiEntry: false,
			});
		});
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
				stores: Array.from(db.objectStoreNames),
			});
		});
	});

	describe('store', () => {
		it('should throw error if object store does not exist', () => {
			expect(() => {
				idxDB.store();
			}).toThrow(/El objectStore undefined no existe./);
		});

		it('should set the current store', () => {
			expect(idxDB.store('testStore').currentStore).toStrictEqual({
				name: 'testStore',
			});
		});

		it('should return the current instance', () => {
			expect(idxDB.store('testStore')).toBeInstanceOf(IdxDB);
		});
	});

	describe('currentStore', () => {
		it('should return the current store', () => {
			expect(idxDB.store('testStore').currentStore).toStrictEqual({
				name: 'testStore',
			});
		});
	});

	describe('get', () => {
		it('should successfully get all data', async () => {
			const result = await idxDB.store('testStore').get();
			expect(result).toHaveLength(2);
			expect(result).toEqual(data);
		});

		it('should successfully get undefined if key does not exist', async () => {
			const result = await idxDB.store('testStore').get(99);
			expect(result).toBeUndefined();
		});

		it('should successfully get data by existing key', async () => {
			const result = await idxDB.store('testStore').get(1);
			expect(result).toEqual(data[0]);
		});

		it('should successfully get undefined if indexed property value not exist', async () => {
			const result = await idxDB.store('testStore').get({ name: 'Not exist' });
			expect(result).toBeUndefined();
		});

		it('should throw error if get data by not indexed property', async () => {
			await expect(
				idxDB
					.store('testStore')
					.get({ description: 'This is the test 2 description.' })
			).rejects.toThrow();
		});

		it('should successfully get data by indexed property', async () => {
			const result = await idxDB.store('testStore').get({ name: 'Test 1' });
			expect(result).toEqual(data[0]);
		});
	});

	describe('cursor', () => {
		it('should successfully iterate all existing data', async () => {
			let i = 0;
			await idxDB.store('testStore').cursor((record) => {
				expect(record).toStrictEqual(data.at(i));
				i++;
			});
		});

		it('should successfully get all existing data', async () => {
			const results = [];
			await idxDB.store('testStore').cursor((record) => results.push(record));
			expect(results).toStrictEqual(data);
		});

		it('should successfully get existing data', async () => {
			const result = await idxDB.store('testStore').cursor();
			expect(result).toStrictEqual(data.at(-1));
		});
	});

	describe('create', () => {
		it('should throw error if no data is provided', async () => {
			await expect(idxDB.store('testStore').create()).rejects.toThrow(
				/No hay datos para guardar/
			);
		});

		it('should throw error if duplicate item is added', async () => {
			await expect(
				idxDB.store('testStore').create({ id: 1, name: 'Test 1' })
			).rejects.toThrow();
		});

		it('should successfully add data', async () => {
			const data = [
				{ id: 3, name: 'Test 3' },
				{ id: 4, name: 'Test 4' },
			];
			const result = await idxDB.store('testStore').create(data);
			expect(result).toEqual(data);
		});
	});

	describe('update', () => {
		it('should throw error if defines keyPath and provides key', async () => {
			const updatedData = { id: 3, name: 'Updated Test 3' };
			await expect(
				idxDB
					.store('testStore')
					.update({ data: updatedData, key: updatedData.id })
			).rejects.toThrow();
		});

		it('should successfully update existing data', async () => {
			const updatedData = { id: 1, name: 'Updated Test 1' };
			const result = await idxDB
				.store('testStore')
				.update({ data: updatedData });
			expect(result).toBe(updatedData.id);
		});
	});

	describe('delete', () => {
		it('should throw error if key is not specified', async () => {
			await expect(idxDB.store('testStore').delete()).rejects.toThrow(
				/No se especifico la clave para eliminar/
			);
		});

		it('should successfully delete data', async () => {
			expect(await idxDB.store('testStore').delete(1)).toBeUndefined();
		});
	});
});
