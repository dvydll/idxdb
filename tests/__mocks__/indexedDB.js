class MockObjectStore {
	constructor() {
		this.store = new Map(); // Almacena los elementos
	}

	add(item) {
		const request = {
			onsuccess: null,
			onerror: null,
			execute: () => {
				if (this.store.has(item.id)) {
					const errorEvent = new Event('error');
					if (request.onerror) {
						request.onerror(errorEvent);
					}
				} else {
					this.store.set(item.id, item);
					const successEvent = new Event('success');
					if (request.onsuccess) {
						request.onsuccess(successEvent);
					}
				}
			},
		};
		return request;
	}

	put(item, key) {
		const request = {
			onsuccess: null,
			onerror: null,
			execute: () => {
				if (!key || !this.store.has(key)) {
					this.store.set(item.id, item);
				} else {
					const errorEvent = new Event('error');
					if (request.onerror) {
						request.onerror(errorEvent);
					}
				}
				const successEvent = new Event('success');
				if (request.onsuccess) {
					request.onsuccess(successEvent);
				}
			},
		};
		return request;
	}

	delete(key) {
		const request = {
			onsuccess: null,
			onerror: null,
			execute: () => {
				if (!this.store.has(key)) {
					const errorEvent = new Event('error');
					if (request.onerror) {
						request.onerror(errorEvent);
					}
				} else {
					this.store.delete(key);
					const successEvent = new Event('success');
					if (request.onsuccess) {
						request.onsuccess(successEvent);
					}
				}
			},
		};
		return request;
	}
}

class MockTransaction {
	constructor(store) {
		this.store = store; // Almacenar referencia al store real
	}

	objectStore() {
		return this.store; // Devolver el objeto de la tienda existente
	}
}

class MockDOMStringList extends Set {
	constructor() {
		super();
	}

	has(name) {
		// Renombrar a has para más consistencia
		return this.has(name);
	}
}

class MockDatabase {
	constructor(name) {
		this.name = name;
		this.version = 1;
		this.objectStoreNames = new MockDOMStringList();
		this.stores = new Map(); // Almacena los object stores
	}

	createObjectStore(name) {
		this.objectStoreNames.add(name);
		this.stores.set(name, new MockObjectStore()); // Crear un nuevo store con Map
	}

	transaction(name /* , options */) {
		if (!this.objectStoreNames.has(name)) {
			throw new Error(`El objectStore ${name} no existe.`);
		}
		return new MockTransaction(this.stores.get(name)); // Pasar el store
	}
}

const indexedDB = {
	open: (name = '') => new MockDatabase(name),
};

export { indexedDB };
