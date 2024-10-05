import { describe, expect, it } from 'vitest';
import { IDXDB_ERROR_CODES, IDXDB_ERROR_MESSAGES, IdxDBError } from '../../src/index.js';

describe('IdxDBError', () => {
  // Test del constructor por defecto
  it('should create an error with default UNKNOWN code and message', () => {
    const error = new IdxDBError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('IdxDBError');
    expect(error.errorCode).toBe(IDXDB_ERROR_CODES.UNKNOWN);
    expect(error.message).toContain(IDXDB_ERROR_MESSAGES[IDXDB_ERROR_CODES.UNKNOWN]);
  });

  // Test con un código de error válido
  it('should create an error with a specific code and default message', () => {
    const error = new IdxDBError(IDXDB_ERROR_CODES.KEY_EXISTS);

    expect(error.errorCode).toBe(IDXDB_ERROR_CODES.KEY_EXISTS);
    expect(error.message).toContain(IDXDB_ERROR_MESSAGES[IDXDB_ERROR_CODES.KEY_EXISTS]);
  });

  // Test con un mensaje personalizado
  it('should create an error with a custom message', () => {
    const customMessage = 'Custom error message';
    const error = new IdxDBError(IDXDB_ERROR_CODES.CONSTRAINT_VIOLATION, customMessage);

    expect(error.errorCode).toBe(IDXDB_ERROR_CODES.CONSTRAINT_VIOLATION);
    expect(error.message).toContain(customMessage);
  });

  // Test con un código de error inválido
  it('should fallback to UNKNOWN for invalid error code', () => {
    const invalidCode = 999; // No existe en IDXDB_ERROR_CODES
    const error = new IdxDBError(invalidCode);

    expect(error.errorCode).toBe(IDXDB_ERROR_CODES.UNKNOWN);
    expect(error.message).toContain(IDXDB_ERROR_MESSAGES[IDXDB_ERROR_CODES.UNKNOWN]);
  });

  // Test para el método fromRequest con un ConstraintError
  it('should create an error from request with ConstraintError', () => {
    const request = { error: { name: 'ConstraintError', message: 'A constraint error' } };
    const error = IdxDBError.fromRequest(request);

    expect(error.errorCode).toBe(IDXDB_ERROR_CODES.CONSTRAINT_VIOLATION);
    expect(error.message).toContain('A constraint error');
  });

  // Test para el método fromRequest con VersionError
  it('should create an error from request with VersionError', () => {
    const request = { error: { name: 'VersionError', message: 'A version error occurred' } };
    const error = IdxDBError.fromRequest(request);

    expect(error.errorCode).toBe(IDXDB_ERROR_CODES.VERSION_ERR);
    expect(error.message).toContain('A version error occurred');
  });

  // Test para el método fromRequest con error desconocido
  it('should create an error from request with an unknown error', () => {
    const request = { error: { name: 'SomeOtherError', message: 'An unknown error' } };
    const error = IdxDBError.fromRequest(request);

    expect(error.errorCode).toBe(IDXDB_ERROR_CODES.UNKNOWN);
    expect(error.message).toContain('An unknown error');
  });

  // Test para verificar la asignación de detalles adicionales
  it('should assign additional details to the error object', () => {
    const details = { key: 'myKey', transactionId: '123' };
    const error = new IdxDBError(IDXDB_ERROR_CODES.KEY_EXISTS, '', details);

    expect(error.key).toBe('myKey');
    expect(error.transactionId).toBe('123');
  });
});
