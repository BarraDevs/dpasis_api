import { Strategy } from 'passport-jwt';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: any): Payload;
}
export {};
