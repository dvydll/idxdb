export const IDXDB_ERROR_CODES = Object.freeze({
	UNKNOWN: 1,
	KEY_EXISTS: 2,
	CONSTRAINT_VIOLATION: 3,
	VERSION_ERR: 4,
	TRANSACTION_ABORT_ERR: 5,
	// TODO: Add more codes as needed (e.g. NON_EXISTENT_ERR)
});

export const IDXDB_ERROR_MESSAGES = Object.freeze({
	[IDXDB_ERROR_CODES.UNKNOWN]:
		'An unknown error occurred during IndexedDB operation.',
	[IDXDB_ERROR_CODES.KEY_EXISTS]:
		'The key you are trying to add already exists.',
	[IDXDB_ERROR_CODES.CONSTRAINT_VIOLATION]:
		'A constraint violation occurred (e.g., unique key constraint).',
	[IDXDB_ERROR_CODES.VERSION_ERR]:
		'The database version is incorrect or outdated.',
	[IDXDB_ERROR_CODES.TRANSACTION_ABORT_ERR]: 'The transaction was aborted.',
	// TODO: Add messages for other codes
});

export const TRANSACTION_TYPES = Object.freeze({
	/**
	 * Una transacción que permite solo operaciones de lectura (consultas).
	 */
	readonly: 'readonly',
	/**
	 * Una transacción que permite operaciones de lectura y escritura.
	 */
	readwrite: 'readwrite',
	/**
	 * Utilizada durante el proceso de actualización de la versión de la base de datos.
	 * Esta transacción solo se utiliza en el evento onupgradeneeded.
	 */
	versionchange: 'versionchange',
});

export const OBJECT_STORE_OPTIONS = Object.freeze({
	/**
	 * Un booleano que indica si se debe crear un campo de clave autoincrementable.
	 */
	autoIncrement: { autoIncrement: true },
	/**
	 * Especifica el nombre del campo que servirá como clave primaria del almacén de objetos.
	 * @type {(keyPath:string)=>({keyPath:string})}
	 */
	keyPath: (keyPath) => ({ keyPath }),
	/**
	 * Un booleano que indica si se deben permitir claves duplicadas en el almacén de objetos.
	 */
	unique: { unique: true },
	/**
	 * Un booleano que indica si se deben permitir valores de entrada múltiple para un mismo campo en los índices.
	 */
	multiEntry: { multiEntry: true },
});
