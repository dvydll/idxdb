'use strict';

import { OBJECT_STORE_OPTIONS, TRANSACTION_TYPES } from './constants';
import { IdxDBError } from './errors';
import { IdxDBCommand, IdxDBQuery } from './helpers';

/**
 * Crea un contexto de una base de datos en indexedDB con las operaciones CRUD básicas
 * @class
 */
export class IdxDB {
	/**
	 * @type {IDBDatabase}
	 * @private
	 */
	#db;

	/**
	 * @type {IdxDBQuery}
	 * @private
	 */
	#dbQuery;

	/**
	 * @type {IdxDBCommand}
	 * @private
	 */
	#dbCommand;

	/**
	 * @type {string}
	 * @private
	 */
	#currentStoreName;

	#usePersistentQuery;
	#usePersistentCommand;

	/**
	 * Tipos de transacciones para IndexedDB.
	 * @readonly
	 * @static
	 * @enum {TRANSACTION_TYPES}
	 */
	static get TRANSACTION_TYPES() {
		return TRANSACTION_TYPES;
	}

	/**
	 * Opciones para configurar un almacén de objetos en IndexedDB.
	 * @readonly
	 * @static
	 * @enum {OBJECT_STORE_OPTIONS}
	 */
	static get OBJECT_STORE_OPTIONS() {
		return OBJECT_STORE_OPTIONS;
	}

	get currentStore() {
		return {
			name: this.#currentStoreName,
		};
	}

	get dbInfo() {
		return {
			name: this.#db.name,
			version: this.#db.version,
			stores: Array.from(this.#db.objectStoreNames),
		};
	}

	constructor(
		db,
		{ usePersistentQuery = true, usePersistentCommand = true } = {}
	) {
		this.#db = db;
		this.#usePersistentQuery = usePersistentQuery;
		this.#usePersistentCommand = usePersistentCommand;
		if (usePersistentQuery) this.#dbQuery = new IdxDBQuery(db);
		if (usePersistentCommand) this.#dbCommand = new IdxDBCommand(db);
	}

	static async init({
		dbName = 'db',
		version = undefined,
		stores = [],
		usePersistentCommand = true,
		usePersistentQuery = true,
	} = {}) {
		const openRequest = indexedDB.open(dbName, version);
		try {
			const db = await new Promise((resolve, reject) => {
				openRequest.onupgradeneeded = (event) => {
					const db = event.target.result;

					stores.forEach(({ name, options }) => {
						if (!db.objectStoreNames.contains(name))
							db.createObjectStore(name, options);
					});

					resolve(db);
				};
				openRequest.onsuccess = (event) => resolve(event.target.result);
				openRequest.onerror = (event) => reject(event.target.error);
			});
			return new IdxDB(db, { usePersistentQuery, usePersistentCommand });
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async createStore({
		name,
		options = IdxDB.OBJECT_STORE_OPTIONS.autoIncrement,
	}) {
		try {
			if (this.#db.objectStoreNames.contains(name))
				throw new IdxDBError(0, `El objectStore ${name} ya existe.`);

			// Comprueba si hay transacciones activas en la base de datos actual
			if (this.#db.transactionNames.length > 0) {
				// Si hay transacciones activas, espera a que se completen
				await Promise.all(
					Array.from(this.#db.transactionNames).map(async (txName) => {
						const tx = this.#db.transaction(txName);
						await new Promise((resolve) => (tx.oncomplete = resolve));
					})
				);
			}

			this.#db.close();
			const newVersion = this.#db.version + 1;
			const openRequest = indexedDB.open(this.#db.name, newVersion);
			const db = await new Promise((resolve, reject) => {
				openRequest.onupgradeneeded = (event) => {
					const upgradedDb = event.target.result;
					if (!upgradedDb.objectStoreNames.contains(name))
						upgradedDb.createObjectStore(name, options);
				};
				openRequest.onsuccess = (event) => resolve(event.target.result);
				openRequest.onerror = (event) => reject(event.target.error);
			});
			this.#db = db;
			if (this.#usePersistentQuery) this.#dbQuery = new IdxDBQuery(db);
			if (this.#usePersistentCommand) this.#dbCommand = new IdxDBCommand(db);
			return this;
		} catch (error) {
			if (error instanceof IdxDBError) throw error;
			throw new IdxDBError(0, 'Error al crear el objectStore.', error);
		}
	}

	store(name = undefined) {
		if (!this.#db.objectStoreNames.contains(name))
			throw new IdxDBError(0, `El objectStore ${name} no existe.`);

		this.#currentStoreName = name;
		return this;
	}

	async get(
		key = undefined,
		{
			store = this.#currentStoreName,
			options = IdxDB.TRANSACTION_TYPES.readonly,
		} = {}
	) {
		if (this.#usePersistentQuery)
			return await this.#dbQuery.get(key, { store, options });

		const transientDBQuery = new IdxDBQuery(this.#db);
		return await transientDBQuery.get(key, { store, options });
	}

	/**
	 * Realiza una operación definida por el callback proporcionado por cada elemento del almacén de objetos.
	 * @param {() => unknown} recordHandler
	 * @param {{name = this.#currentStoreName,options = IdxDB.TRANSACTION_TYPES.readonly}} [param1={}]
	 * @returns
	 */
	async cursor(
		recordHandler = (record) => record,
		index = undefined,
		{
			store = this.#currentStoreName,
			options = IdxDB.TRANSACTION_TYPES.readonly,
		} = {}
	) {
		if (this.#usePersistentQuery)
			return await this.#dbQuery.cursor(recordHandler, index, {
				store,
				options,
			});

		const transientDBQuery = new IdxDBQuery(this.#db);
		return await transientDBQuery.cursor(recordHandler, index, {
			store,
			options,
		});
	}

	async create(
		data = [],
		{
			store = this.#currentStoreName,
			options = IdxDB.TRANSACTION_TYPES.readwrite,
		} = {}
	) {
		if (this.#usePersistentCommand)
			return await this.#dbCommand.create(data, { store, options });

		const transientCommand = new IdxDBCommand(this.#db);
		return await transientCommand.create(data, { store, options });
	}

	async update(
		{ data, key = undefined },
		{
			store = this.#currentStoreName,
			options = IdxDB.TRANSACTION_TYPES.readwrite,
		} = {}
	) {
		return await this.#dbCommand.update({ data, key }, { store, options });
	}

	async delete(
		key = undefined,
		{
			store = this.#currentStoreName,
			options = IdxDB.TRANSACTION_TYPES.readwrite,
		} = {}
	) {
		return await this.#dbCommand.delete(key, { store, options });
	}
}
