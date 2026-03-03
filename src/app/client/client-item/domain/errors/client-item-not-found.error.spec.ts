import { ClientItemNotFoundError } from './client-item-not-found.error';

describe('ClientItemNotFoundError', () => {
  it('should be an instance of Error', () => {
    const error = new ClientItemNotFoundError();

    expect(error).toBeInstanceOf(Error);
  });

  it('should have correct message', () => {
    const error = new ClientItemNotFoundError();

    expect(error.message).toBe('Item do cliente não encontrado na base de dados.');
  });

  it('should have correct name', () => {
    const error = new ClientItemNotFoundError();

    expect(error.name).toBe('ClientItemNotFoundError');
  });

  it('should have status code 404', () => {
    const error = new ClientItemNotFoundError();

    expect(error.code).toBe(404);
  });
});
