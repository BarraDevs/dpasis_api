import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [
    JwtStrategy,
  ],
  exports: [
    JwtModule,
  ],
})
export class JwtAuthModule {}
