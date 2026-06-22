import { Module } from '@nestjs/common';
import { NfGenerationModule } from 'src/infra/nf-generation/nf-generation.module';
import { NfGenerationTestController } from './infra/drivers/http/nf-generation-test.controller';

@Module({
  imports: [
    NfGenerationModule.register(),
  ],
  controllers: [
    NfGenerationTestController,
  ],
})
export class NfGenerationTestModule {}
