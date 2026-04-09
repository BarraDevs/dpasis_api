import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProposalValidityDto } from 'src/app/service/proposal-validity/application/dtos/proposal-validity.dto';
import { IProposalValidityDao } from 'src/app/service/proposal-validity/application/persistence/dao/proposal-validity-dao.interface';
import { CreateProposalValidityInputDto } from 'src/app/service/proposal-validity/application/usecases/create-proposal-validity/dtos/create-proposal-validity.dto';
import { EditProposalValidityInputDto } from 'src/app/service/proposal-validity/application/usecases/edit-proposal-validity/dtos/edit-proposal-validity.dto';
import { FindAllProposalValidityQueryDto } from 'src/app/service/proposal-validity/application/usecases/find-all-proposal-validity/dtos/find-all-proposal-validity.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ProposalValiditySelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProposalValiditySelect;

@Injectable()
export class ProposalValidityDaoAdapterPrisma implements IProposalValidityDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllProposalValidityQueryDto): Promise<[ProposalValidityDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ProposalValidityWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ProposalValidityWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.proposalValidity.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ProposalValiditySelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.proposalValidity.count({ where }),
    ]);

    return [rows, total];
  }

  public async findById(id: number): Promise<ProposalValidityDto | null> {
    return this.prisma.proposalValidity.findUnique({
      where: { id },
      select: ProposalValiditySelect,
    });
  }

  public async findByName(name: string): Promise<ProposalValidityDto | null> {
    return this.prisma.proposalValidity.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ProposalValiditySelect,
    });
  }

  public async save(data: CreateProposalValidityInputDto): Promise<number> {
    const result = await this.prisma.proposalValidity.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditProposalValidityInputDto): Promise<void> {
    await this.prisma.proposalValidity.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.proposalValidity.delete({
      where: { id },
    });
  }

  public async countServicesByProposalValidityId(proposalValidityId: number): Promise<number> {
    return this.prisma.service.count({
      where: { proposalValidityId: proposalValidityId },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.proposalValidity.update({
      where: { id },
      data: { active },
    });
  }
}
