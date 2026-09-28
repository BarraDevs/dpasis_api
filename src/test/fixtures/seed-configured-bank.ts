import { BankCertFormat } from 'src/app/global/bank/domain/enums/bank-cert-format.enum';
import { hashWebhookToken } from 'src/app/global/bank/application/helpers/bank-integration-secret.helper';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { ILocalSecureFileGateway } from 'src/infra/local-secure-file/local-secure-file.gateway';
import type { ISecretsCryptoGateway } from 'src/infra/secrets-crypto/secrets-crypto.gateway';
import type { TestingModule } from '@nestjs/testing';
import { buildTestTlsMaterial } from './test-certificate';

export async function seedConfiguredBank(
  module: TestingModule,
  overrides: { webhookToken?: string } = {},
): Promise<{ bankId: number }> {
  const prisma = module.get(PrismaService);
  const crypto = module.get<ISecretsCryptoGateway>(TOKENS.SecretsCryptoGateway);
  const files = module.get<ILocalSecureFileGateway>(TOKENS.LocalSecureFileGateway);
  const material = buildTestTlsMaterial();
  const suffix = `${Date.now()}${Math.random()}`.replace('.', '');
  const webhookToken = overrides.webhookToken;

  const bank = await prisma.bank.create({
    data: {
      drawer: 'Drawer Inter',
      wallet: '1',
      account: `A${suffix}`.slice(0, 20),
      agency: '0001',
      bankCode: `B${suffix}`.slice(0, 20),
      bankName: 'Inter',
      paymentLocation: null,
      active: true,
      apiUrl: 'https://cdpj-sandbox.partners.uatinter.co',
      clientIdCiphertext: crypto.encrypt('client-id'),
      clientIdHint: 't-id',
      clientSecretCiphertext: crypto.encrypt('client-secret'),
      webhookTokenHash: webhookToken ? hashWebhookToken(webhookToken) : null,
      certFormat: BankCertFormat.PemPair,
    },
  });

  const certFilePath = `${bank.id}/cert.enc`;
  const keyFilePath = `${bank.id}/key.enc`;
  await files.write(certFilePath, crypto.encryptBytes(Buffer.from(material.certPem, 'utf8')));
  await files.write(keyFilePath, crypto.encryptBytes(Buffer.from(material.keyPem, 'utf8')));
  await prisma.bank.update({
    where: { id: bank.id },
    data: { certFilePath, keyFilePath },
  });

  return { bankId: bank.id };
}
