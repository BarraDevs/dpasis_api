import { ApiProperty } from '@nestjs/swagger';

export class IPagination<T> {
  @ApiProperty() currentPage: number;
  @ApiProperty() itemsPerPage: number;
  @ApiProperty() totalItems: number;
  @ApiProperty() totalPages: number;
  @ApiProperty() data: T[];
};

export class Pagination<T> {
  private readonly page: number;
  private readonly size: number;
  private readonly total: number;
  private readonly rows: T[];

  constructor(data: T[], total: number, page?: number, size?: number) {
    this.rows = data;
    this.total = total;

    // If page or size is not provided, the default value is the total number of items and first page.
    // This is useful when the user wants to get all items without pagination.
    this.page = page ?? 1;
    this.size = size ?? this.total;
  }

  public getDto(): IPagination<T> {
    return {
      currentPage: this.page,
      itemsPerPage: this.size,
      totalItems: this.total,
      totalPages: this.calculateTotalPages(),
      data: this.rows,
    };
  }

  private calculateTotalPages(): number {
    if (this.size === 0) {
      return 0;
    }
    return Math.ceil(this.total / this.size);
  }
}
