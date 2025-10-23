import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtWebSocketAuthGuard extends AuthGuard('jwt-ws') {}
