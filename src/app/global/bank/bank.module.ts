import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CertificateParserModule } from 'src/infra/certificate-parser/certificate-parser.module';
import { LocalSecureFileModule } from 'src/infra/local-secure-file/local-secure-file.module';
import { SecretsCryptoModule } from 'src/infra/secrets-crypto/secrets-crypto.module';
import { BankPersistenceModule } from './application/persistence/bank-persistence.module';
import { CreateBank } from './application/usecases/create-bank/create-bank.service';
import { DeleteBank } from './application/usecases/delete-bank/delete-bank.service';
import { EditBank } from './application/usecases/edit-bank/edit-bank.service';
import { FindAllBank } from './application/usecases/find-all-bank/find-all-bank.service';
import { FindBankById } from './application/usecases/find-bank-by-id/find-bank-by-id.service';
import { FindBankByWebhookToken } from './application/usecases/find-bank-by-webhook-token/find-bank-by-webhook-token.service';
import { InspectBankCertificates } from './application/usecases/inspect-bank-certificates/inspect-bank-certificates.service';
import { ResolveBankIntegrationCredentials } from './application/usecases/resolve-bank-integration-credentials/resolve-bank-integration-credentials.service';
import { RotateBankWebhookToken } from './application/usecases/rotate-bank-webhook-token/rotate-bank-webhook-token.service';
import { UpdateBankStatus } from './application/usecases/update-bank-status/update-bank-status.service';
import { UploadBankCertificate } from './application/usecases/upload-bank-certificate/upload-bank-certificate.service';
import { BankAdminController } from './infra/drivers/http/admin/bank-admin.controller';

@Module({
  imports: [
    BankPersistenceModule,
    AuthenticationGuardsModule,
    SecretsCryptoModule.register(),
    LocalSecureFileModule.register(),
    CertificateParserModule.register(),
  ],
  controllers: [
    BankAdminController,
  ],
  providers: [
    CreateBank,
    DeleteBank,
    EditBank,
    FindAllBank,
    FindBankById,
    FindBankByWebhookToken,
    InspectBankCertificates,
    ResolveBankIntegrationCredentials,
    RotateBankWebhookToken,
    UpdateBankStatus,
    UploadBankCertificate,
  ],
  exports: [
    FindBankById,
    FindBankByWebhookToken,
    InspectBankCertificates,
    ResolveBankIntegrationCredentials,
  ],
})
export class BankModule {}
