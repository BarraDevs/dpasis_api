import { Strategy } from 'passport-jwt';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
declare const JwtWebSocketStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtWebSocketStrategy extends JwtWebSocketStrategy_base {
    constructor();
    validate(payload: any): Payload;
    private static extractJwtFromSocket;
}
export {};
