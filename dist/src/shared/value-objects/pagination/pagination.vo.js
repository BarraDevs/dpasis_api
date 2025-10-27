"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = exports.IPagination = void 0;
const swagger_1 = require("@nestjs/swagger");
class IPagination {
    currentPage;
    itemsPerPage;
    totalItems;
    totalPages;
    data;
}
exports.IPagination = IPagination;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], IPagination.prototype, "currentPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], IPagination.prototype, "itemsPerPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], IPagination.prototype, "totalItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], IPagination.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], IPagination.prototype, "data", void 0);
;
class Pagination {
    page;
    size;
    total;
    rows;
    constructor(data, total, page, size) {
        this.rows = data;
        this.total = total;
        this.page = page ?? 1;
        this.size = size ?? this.total;
    }
    getDto() {
        return {
            currentPage: this.page,
            itemsPerPage: this.size,
            totalItems: this.total,
            totalPages: this.calculateTotalPages(),
            data: this.rows,
        };
    }
    calculateTotalPages() {
        if (this.size === 0) {
            return 0;
        }
        return Math.ceil(this.total / this.size);
    }
}
exports.Pagination = Pagination;
//# sourceMappingURL=pagination.vo.js.map