'use strict';

import { TRANSACTION_TYPES } from '../constants/index.js';
import { IdxDBError } from '../errors/idxdb-error.js';

export class IdxDBCommand {
	/**
	 * @type {IDBDatabase}
	 * @private
	 */
	#db;

	constructor(db) {
		this.#db = db;
	}

	async create(
		data = [],
		{ store = '', options = TRANSACTION_TYPES.readwrite } = {}
	) {
		let tx;
		data = Array.from(data);
		try {
			if (!this.#db.objectStoreNames.contains(store))
				throw new IdxDBError(0, `El objecStore ${store} no existe.`, {
					data,
					store,
					options,
				});

			if (!data || data.length === 0)
				throw new IdxDBError(0, 'No hay datos para guardar', {
					data,
					store,
					options,
				});

			tx = this.#db.transaction(store, options);
			const objStore = tx.objectStore(store);
			return await Promise.all(
				data.map(
					(item) =>
						new Promise((resolve, reject) => {
							const dbReq = objStore.add(item);
							dbReq.onsuccess = () => resolve(item);
							dbReq.onerror = (event) => reject(event.target.error);
						})
				)
			);
		} catch (error) {
			if (tx && tx instanceof IDBTransaction) tx.abort();
			if (error instanceof IdxDBError) throw error;
			throw new IdxDBError(0, 'No se han podido guardar los datos.', {
				...error,
				data,
				store,
				options,
			});
		}
	}

	async update(
		{ data, key = undefined },
		{ store = '', options = TRANSACTION_TYPES.readwrite } = {}
	) {
		let tx;
		try {
			if (!this.#db.objectStoreNames.contains(store))
				throw new IdxDBError(0, `El objecStore ${store} no existe.`);

			tx = this.#db.transaction(store, options);
			const objStore = tx.objectStore(store);
			const dbReq = objStore.put(data, key);
			return await new Promise((resolve, reject) => {
				dbReq.onsuccess = (event) => resolve(event.target.result);
				dbReq.onerror = (event) => reject(event.target.error);
			});
		} catch (error) {
			if (tx && tx instanceof IDBTransaction) tx.abort();
			if (error instanceof IdxDBError) throw error;
			throw new IdxDBError(0, 'Error al actualizar datos.', { ...error });
		}
	}

	async delete(
		{ key },
		{ store = '', options = TRANSACTION_TYPES.readwrite } = {}
	) {
		let tx;
		try {
			if (!this.#db.objectStoreNames.contains(store))
				throw new IdxDBError(0, `El objecStore ${store} no existe.`, {
					objectStorestore: store,
				});

			if (!key)
				throw new IdxDBError(0, 'No se especifico la clave para eliminar.', {
					key,
				});

			tx = this.#db.transaction(store, options);
			const objStore = tx.objectStore(store);
			const request = objStore.delete(key);
			return await new Promise((resolve, reject) => {
				request.onsuccess = (event) => resolve(event.target.result);
				request.onerror = (event) => reject(event.target.error);
			});
		} catch (error) {
			if (tx && tx instanceof IDBTransaction) tx.abort();
			if (error instanceof IdxDBError) throw error;
			throw new IdxDBError(0, 'Error al eliminar datos.', { ...error });
		}
	}
}
