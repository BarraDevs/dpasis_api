import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NfmWithNfseDto } from 'src/app/tax-invoice/nfm/application/dtos/nfm.dto';
import { INfmDao } from 'src/app/tax-invoice/nfm/application/persistence/dao/nfm-dao.interface';
import { FindGeneratedNfmsQueryDto } from 'src/app/tax-invoice/nfm/application/usecases/find-generated-nfms/dtos/find-generated-nfms.dto';
import {
  EditNfmData,
  NfmPersistedRowDto,
  SaveNfmData,
} from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { NfmStatus } from 'src/app/tax-invoice/nfm/domain/enums/nfm-status.enum';
import { NfmNfseMissingError } from 'src/app/tax-invoice/nfm/domain/errors/nfm-nfse-missing.error';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const NfseSelect = {
  id: true,
  companyId: true,
  clientId: true,
  rpsNumber: true,
  rpsSeries: true,
  status: true,
  batchProtocol: true,
  nfseNumber: true,
  verificationCode: true,
  issuedAt: true,
  errorMessage: true,
  canceledAt: true,
  cancelReasonCode: true,
  data: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NfseSelect;

const NfmWithNfseSelect = {
  id: true,
  clientId: true,
  clientDocument: true,
  companyName: true,
  status: true,
  referenceMonth: true,
  referenceYear: true,
  totalValueInCents: true,
  cnaeNbsIndopId: true,
  createdAt: true,
  updatedAt: true,
  nfse: { select: NfseSelect },
} satisfies Prisma.NfmSelect;

@Injectable()
export class NfmDaoAdapterPrisma implements INfmDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindGeneratedNfmsQueryDto): Promise<[NfmWithNfseDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.NfmWhereInput[] = [
      { nfseId: { not: null } },
    ];

    if (queries.dateStart) {
      conditions.push({
        createdAt: { gte: new Date(`${queries.dateStart}T00:00:00.000-03:00`) },
      });
    }

    if (queries.dateEnd) {
      conditions.push({
        createdAt: { lte: new Date(`${queries.dateEnd}T23:59:59.999-03:00`) },
      });
    }

    const where: Prisma.NfmWhereInput = { AND: conditions };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.nfm.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: NfmWithNfseSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.nfm.count({ where }),
    ]);

    return [rows.map((row) => this.mapToDto(row)), total];
  }

  public async findByClientReferenceAndCnae(
    clientId: number,
    referenceMonth: number,
    referenceYear: number,
    cnaeNbsIndopId: number,
  ): Promise<NfmPersistedRowDto | null> {
    const row = await this.prisma.nfm.findUnique({
      where: {
        // Prisma compound unique name (not camelCase by design)
        // eslint-disable-next-line camelcase
        clientId_referenceMonth_referenceYear_cnaeNbsIndopId: {
          clientId,
          referenceMonth,
          referenceYear,
          cnaeNbsIndopId,
        },
      },
      select: {
        id: true,
        nfseId: true,
        status: true,
      },
    });

    return row;
  }

  public async save(data: SaveNfmData): Promise<number> {
    const result = await this.prisma.nfm.create({
      data: {
        clientId: data.clientId,
        clientDocument: data.clientDocument,
        companyName: data.companyName,
        status: data.status,
        referenceMonth: data.referenceMonth,
        referenceYear: data.referenceYear,
        totalValueInCents: data.totalValueInCents,
        cnaeNbsIndopId: data.cnaeNbsIndopId,
        nfseId: data.nfseId ?? null,
        data: data.data as unknown as Prisma.InputJsonValue,
      },
    });

    return result.id;
  }

  public async edit(id: number, data: EditNfmData): Promise<void> {
    await this.prisma.nfm.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.nfseId !== undefined ? { nfseId: data.nfseId } : {}),
      },
    });
  }

  private mapToDto(
    row: Prisma.NfmGetPayload<{ select: typeof NfmWithNfseSelect }>,
  ): NfmWithNfseDto {
    if (!row.nfse) {
      throw new NfmNfseMissingError(row.id);
    }

    return {
      id: row.id,
      clientId: row.clientId,
      clientDocument: row.clientDocument,
      companyName: row.companyName,
      status: row.status as NfmStatus,
      referenceMonth: row.referenceMonth,
      referenceYear: row.referenceYear,
      totalValueInCents: row.totalValueInCents,
      cnaeNbsIndopId: row.cnaeNbsIndopId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      nfse: {
        ...row.nfse,
        status: row.nfse.status as NfseStatus,
        data: row.nfse.data as Record<string, unknown>,
      },
    };
  }
}
