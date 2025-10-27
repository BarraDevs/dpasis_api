import { Pagination } from './pagination.vo';

describe('Pagination value object', () => {
  it('should create a pagination object with default values', () => {
    // Arrange
    const data = ['foo', 'bar'];

    // Act
    const pagination = new Pagination<string>(data, data.length);

    // Assert
    expect(pagination.getDto()).toEqual({
      currentPage: 1,
      itemsPerPage: 2,
      totalItems: 2,
      totalPages: 1,
      data,
    });
  });

  it('should create a pagination object with custom values', () => {
    // Arrange
    const data = ['foo', 'bar'];
    const page = 2;
    const size = 1;

    // Act
    const pagination = new Pagination<string>(data, data.length, page, size);

    // Assert
    expect(pagination.getDto()).toEqual({
      currentPage: page,
      itemsPerPage: size,
      totalItems: data.length,
      totalPages: Math.ceil(data.length / size),
      data,
    });
  });

  it('should create a pagination object even though there is no data', () => {
    // Arrange
    const data: any[] = [];

    // Act
    const pagination = new Pagination<string>(data, data.length);

    // Assert
    expect(pagination.getDto()).toEqual({
      currentPage: 1,
      itemsPerPage: 0,
      totalItems: 0,
      totalPages: 0,
      data,
    });
  });
});
