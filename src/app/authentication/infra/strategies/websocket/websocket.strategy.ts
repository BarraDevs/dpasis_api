import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Socket } from 'socket.io';
import { Payload } from 'src/app/authentication/domain/types/payload.type';

@Injectable()
export class JwtWebSocketStrategy extends PassportStrategy(Strategy, 'jwt-ws') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([JwtWebSocketStrategy.extractJwtFromSocket]),
      ignoreExpiration: true,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  public validate(payload: any): Payload {
    return {
      sub: payload.sub,
      roles: payload.roles,
    };
  }

  private static extractJwtFromSocket(socket: Socket): string | null {
    const [type, token] = socket.handshake.headers?.authorization?.split(' ') || [];
    return type === 'Bearer' ? token : null;
  }
}
