'use strict';
import { IDXDB_ERROR_CODES, IDXDB_ERROR_MESSAGES } from '../constants';

export class IdxDBError extends Error {
	constructor(
		errorCode = IDXDB_ERROR_CODES.UNKNOWN,
		message = '',
		details = {}
	) {
		if (!Object.values(IDXDB_ERROR_CODES).includes(errorCode))
			errorCode = IDXDB_ERROR_CODES.UNKNOWN;

		const errorMsg =
			typeof message === 'string' && message.trim()
				? message
				: IDXDB_ERROR_MESSAGES[errorCode];

		super(`[${new Date().toISOString()}] [ERROR] ${errorMsg}`);
		this.name = 'IdxDBError';
		this.errorCode = errorCode;
		Object.assign(this, details);
	}

	static fromRequest(request) {
		if (request && request.error) {
			const { error } = request;
			let errorCode = IDXDB_ERROR_CODES.UNKNOWN;
			switch (error.name) {
				case 'ConstraintError':
					errorCode = IDXDB_ERROR_CODES.CONSTRAINT_VIOLATION;
					break;
				case 'VersionError':
					errorCode = IDXDB_ERROR_CODES.VERSION_ERR;
					break;
				case 'AbortError':
					errorCode = IDXDB_ERROR_CODES.TRANSACTION_ABORT_ERR;
					break;
				// Maneja otros tipos de error aquí
				default:
					errorCode = IDXDB_ERROR_CODES.UNKNOWN;
			}
			return new IdxDBError(errorCode, error.message, { request });
		}
		return new IdxDBError(IDXDB_ERROR_CODES.UNKNOWN);
	}

	[Symbol.toStringTag]() {
		return this.name;
	}
}
