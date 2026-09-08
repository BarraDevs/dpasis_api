import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { IAuditLogDao } from '../../persistence/dao/audit-log-dao.interface';
import { JOB_AUDIT_METHOD, RecordJobAudit } from './record-job-audit.service';

describe('RecordJobAudit - Unit tests', () => {
  let sut: RecordJobAudit;
  let auditLogDao: IAuditLogDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        RecordJobAudit,
        { provide: TOKENS.AuditLogDao, useValue: createMock<IAuditLogDao>() },
      ],
    }).compile();

    sut = module.get(RecordJobAudit);
    auditLogDao = module.get(TOKENS.AuditLogDao);
    jest.spyOn(auditLogDao, 'save').mockResolvedValue();
  });

  it('should record an asynchronous transition with who, what and why', async() => {
    // Act
    sut.record({
      jobName: 'poll-nfse-batch',
      nfseId: 42,
      from: 'SUBMITTED',
      to: 'ISSUED',
      reason: 'NFS-e 56037',
    });

    // Assert — sem conta associada: quem agiu foi o job, não uma pessoa.
    expect(auditLogDao.save).toHaveBeenCalledWith({
      accountId: null,
      method: JOB_AUDIT_METHOD,
      url: 'job:poll-nfse-batch',
      params: { nfseId: 42 },
      body: { from: 'SUBMITTED', to: 'ISSUED', reason: 'NFS-e 56037' },
      statusCode: 200,
      ip: null,
    });
  });

  it('should mark a failed transition with a 500', async() => {
    // Act
    sut.record({ jobName: 'issue-nfse-batch', nfseId: 42, to: 'REJECTED', succeeded: false });

    // Assert
    expect(auditLogDao.save).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
  });

  it('should never break the job it observes', async() => {
    // Arrange
    jest.spyOn(auditLogDao, 'save').mockRejectedValue(new Error('banco fora do ar'));

    // Act & Assert
    expect(() => sut.record({ jobName: 'reconcile-nfse', nfseId: 1, to: 'ISSUED' })).not.toThrow();
    await new Promise(process.nextTick);
  });
});
