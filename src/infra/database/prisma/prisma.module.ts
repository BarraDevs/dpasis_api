import { Module, Provider } from '@nestjs/common';
import { PrismaFilterCompilerService } from './filter-compiler/prisma-filter-compiler.service';
import { PrismaService } from './prisma.service';

const providers: Provider[] = [
  PrismaService,
  PrismaFilterCompilerService,
];

@Module({
  providers: [...providers],
  exports: [...providers],
})
export class PrismaModule {}
