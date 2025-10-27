export declare class IPagination<T> {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    data: T[];
}
export declare class Pagination<T> {
    private readonly page;
    private readonly size;
    private readonly total;
    private readonly rows;
    constructor(data: T[], total: number, page?: number, size?: number);
    getDto(): IPagination<T>;
    private calculateTotalPages;
}
