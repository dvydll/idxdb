// idxdb-command.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { IdxDB } from '../../src/index.js'; // Ajusta la ruta según tu estructura
import { indexedDB } from '../__mocks__/indexedDB.js'; // Asegúrate de que la ruta sea correcta

describe('IdxDB', () => {
	let db;
	/**
	 * @type {IdxDB}
	 */
	let idxDB;

	beforeEach(() => {
		db = indexedDB.open();
		db.createObjectStore('testStore'); // Crea un objeto para pruebas
		idxDB = new IdxDB(db);
	});

	describe('constructor', () => {
		it('should create an instance of IdxDB', () => {
			expect(idxDB).toBeInstanceOf(IdxDB);
		});
	});

	describe('dbInfo', () => {
		it('should return the database information', () => {
			expect(idxDB.dbInfo).toEqual({
				name: '',
				version: 1,
				stores: ['testStore'],
			});
		});
	});
});
