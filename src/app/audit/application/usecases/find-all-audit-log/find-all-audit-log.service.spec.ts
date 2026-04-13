import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { AuditLogDto } from '../../dtos/audit-log.dto';
import { IAuditLogDao } from '../../persistence/dao/audit-log-dao.interface';
import { FindAllAuditLogQueryDto } from './dtos/find-all-audit-log.dto';
import { FindAllAuditLog } from './find-all-audit-log.service';

describe('FindAllAuditLog - Unit tests', () => {
  let sut: FindAllAuditLog;
  let auditLogDao: IAuditLogDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllAuditLog,
        { provide: TOKENS.AuditLogDao, useValue: createMock<IAuditLogDao>() },
      ],
    }).compile();

    sut = module.get(FindAllAuditLog);
    auditLogDao = module.get(TOKENS.AuditLogDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call dao.findAll with queries and return paginated result', async() => {
    const queries: FindAllAuditLogQueryDto = { page: 1, size: 10 };
    const log = createMock<AuditLogDto>({ id: 1 });
    jest.spyOn(auditLogDao, 'findAll').mockResolvedValue([[log], 1]);

    const result = await sut.execute(queries);

    expect(auditLogDao.findAll).toHaveBeenCalledWith(queries);
    expect(result.data).toEqual([log]);
    expect(result.totalItems).toBe(1);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should return empty pagination when dao returns no results', async() => {
    jest.spyOn(auditLogDao, 'findAll').mockResolvedValue([[], 0]);

    const result = await sut.execute({});

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should pass filters to dao.findAll', async() => {
    const queries: FindAllAuditLogQueryDto = {
      accountId: 5,
      method: 'POST',
      search: '/admin/client',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    };
    jest.spyOn(auditLogDao, 'findAll').mockResolvedValue([[], 0]);

    await sut.execute(queries);

    expect(auditLogDao.findAll).toHaveBeenCalledWith(queries);
  });
});
