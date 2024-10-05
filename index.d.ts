// index.d.ts

// Definir la configuración del almacén de objetos
export interface ObjectStoreConfig {
	/**
	 * Nombre del almacén de objetos.
	 * @default 'store'
	 */
	name?: string;

	/**
	 * Configuración del almacén de objetos.
	 * @default { autoIncrement: true }
	 */
	options?: Readonly<{ autoIncrement?: boolean }>;
}

// Definir la configuración de IndexedDB
export interface IdxDBConfig {
	/**
	 * Nombre de la base de datos.
	 * @default 'db'
	 */
	dbname?: string;

	/**
	 * Versión de la base de datos.
	 * @default 1
	 */
	version?: number;

	/**
	 * Colección de almacenes de objetos.
	 * @default []
	 */
	stores?: Iterable<ObjectStoreConfig>;
}
