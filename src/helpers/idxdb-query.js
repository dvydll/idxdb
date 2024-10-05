'use strict';

import { TRANSACTION_TYPES } from '../constants';
import { IdxDBError } from '../errors';

export class IdxDBQuery {
	/**
	 * @type {IDBDatabase}
	 * @private
	 */
	#db;

	constructor(db) {
		this.#db = db;
	}

	async get(
		query = undefined,
		{ store = '', options = TRANSACTION_TYPES.readonly } = {}
	) {
		let tx, dbReq;
		try {
			if (!this.#db.objectStoreNames.contains(store))
				throw new IdxDBError(0, `El objecStore ${store} no existe.`);

			tx = this.#db.transaction(store, options);
			const objStore = tx.objectStore(store);
			if (query && typeof query === 'object') {
				const [[key, val]] = Object.entries(query);
				const idx = objStore.index(key);
				dbReq = idx.get(val);
			} else {
				dbReq = query ? objStore.get(query) : objStore.getAll();
			}
			// const dbReq = key ? objStore.get(key) : objStore.getAll();
			return await new Promise((resolve, reject) => {
				dbReq.onsuccess = (event) => resolve(event.target.result);
				dbReq.onerror = (event) => reject(event.target.error);
			});
		} catch (error) {
			if (tx && tx instanceof IDBTransaction) tx.abort();
			if (error instanceof IdxDBError) throw error;
			throw new IdxDBError(0, 'No se han podido guardar los datos.', {
				...error,
				store,
				options,
			});
		}
	}

	/**
	 * Realiza una operación definida por el callback proporcionado por cada elemento del almacén de objetos.
	 * @param {() => unknown} recordHandler
	 * @param {{name = this.#currentStoreName,options = IdxDB.TRANSACTION_TYPES.readonly}} [param1={}]
	 * @returns
	 */
	async cursor(
		recordHandler = (record) => record,
		index = null,
		{ store = '', options = TRANSACTION_TYPES.readonly } = {}
	) {
		let tx, result;
		try {
			if (!this.#db.objectStoreNames.contains(store))
				throw new IdxDBError(0, `El objecStore ${store} no existe.`);

			tx = this.#db.transaction(store, options);
			const objStore = tx.objectStore(store);
			// Si se pasa un índice, lo usamos; si no, usamos el objectStore directamente
			const source = index ? objStore.index(index) : objStore;
			const request = source.openCursor();

			return new Promise((resolve, reject) => {
				request.onerror = (event) => reject(event);
				request.onsuccess = async (event) => {
					const cursor = event.target.result;

					// Verificar si hay más registros en el cursor
					if (!cursor) resolve(result);
					try {
						// Llamar al handler de registro
						result = recordHandler(cursor.value);

						// Si el handler devuelve una promesa, esperar a que se resuelva
						if (result instanceof Promise) await result;

						// Continuar con el siguiente registro
						cursor.continue();
					} catch (error) {
						reject(error);
					}
				};
			});
		} catch (error) {
			if (tx && tx instanceof IDBTransaction) tx.abort();
			if (error instanceof IdxDBError) throw error;
			throw new IdxDBError(0, 'No se han podido guardar los datos.', {
				...error,
				recordHandler,
				options,
			});
		}
	}
}
