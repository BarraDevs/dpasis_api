import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuditLogDto } from 'src/app/audit/application/dtos/audit-log.dto';
import { FindAllAuditLogQueryDto } from 'src/app/audit/application/usecases/find-all-audit-log/dtos/find-all-audit-log.dto';
import { FindAllAuditLog } from 'src/app/audit/application/usecases/find-all-audit-log/find-all-audit-log.service';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { AuditLogAdminController } from './audit-log-admin.controller';

describe('AuditLogAdminController - Unit tests', () => {
  let sut: AuditLogAdminController;
  let findAllAuditLogService: FindAllAuditLog;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [AuditLogAdminController],
      providers: [
        { provide: FindAllAuditLog, useValue: createMock<FindAllAuditLog>() },
      ],
    }).compile();

    sut = module.get(AuditLogAdminController);
    findAllAuditLogService = module.get(FindAllAuditLog);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAllAuditLog.execute with queries and return its result', async() => {
      const queries = createMock<FindAllAuditLogQueryDto>();
      const output = createMock<IPagination<AuditLogDto>>();
      jest.spyOn(findAllAuditLogService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllAuditLogService.execute).toHaveBeenCalledWith(queries);
    });
  });
});
