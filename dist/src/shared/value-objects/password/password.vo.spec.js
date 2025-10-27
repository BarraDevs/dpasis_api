"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const password_vo_1 = require("./password.vo");
describe('Password Value Object', () => {
    it('should create a new hashed password', () => {
        const rawPassword = 'T0I2%kBmZez7';
        const newPassword = new password_vo_1.Password(rawPassword);
        expect(newPassword).toBeDefined();
        expect(newPassword.value).not.toBe(rawPassword);
    });
    it('should return true when comparing same password', () => {
        const rawPassword = '123456789';
        const newPassword = new password_vo_1.Password(rawPassword);
        expect(password_vo_1.Password.compare(rawPassword, newPassword.value)).toBe(true);
    });
    it('should return false when comparing different password', () => {
        const rawPassword = '123456789';
        const anotherRawPassword = '987654321';
        const newPassword = new password_vo_1.Password(rawPassword);
        expect(password_vo_1.Password.compare(anotherRawPassword, newPassword.value)).toBe(false);
    });
    it('should generate a random password with 8 characters', () => {
        const randomPassword = password_vo_1.Password.generateRandom();
        expect(randomPassword).toHaveLength(8);
    });
});
//# sourceMappingURL=password.vo.spec.js.map