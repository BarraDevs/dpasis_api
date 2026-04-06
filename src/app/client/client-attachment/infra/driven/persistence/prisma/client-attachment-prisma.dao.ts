import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientAttachmentDto } from 'src/app/client/client-attachment/application/dtos/client-attachment.dto';
import { IClientAttachmentDao } from 'src/app/client/client-attachment/application/persistence/dao/client-attachment-dao.interface';
import { CreateClientAttachmentInputDto } from 'src/app/client/client-attachment/application/usecases/create-client-attachment/dtos/create-client-attachment.dto';
import { EditClientAttachmentInputDto } from 'src/app/client/client-attachment/application/usecases/edit-client-attachment/dtos/edit-client-attachment.dto';
import { FindAllClientAttachmentQueryDto } from 'src/app/client/client-attachment/application/usecases/find-all-client-attachment/dtos/find-all-client-attachment.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientAttachmentSelect = {
  id: true,
  clientId: true,
  description: true,
  link: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientAttachmentSelect;

@Injectable()
export class ClientAttachmentDaoAdapterPrisma implements IClientAttachmentDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientAttachmentQueryDto): Promise<[ClientAttachmentDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientAttachmentWhereInput[] = [
      { clientId: { equals: queries.clientId } },
    ];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { description: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ClientAttachmentWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [attachments, total] = await this.prisma.$transaction([
      this.prisma.clientAttachment.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientAttachmentSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clientAttachment.count({ where }),
    ]);

    return [attachments, total];
  }

  public async findById(id: number): Promise<ClientAttachmentDto | null> {
    return this.prisma.clientAttachment.findUnique({
      where: { id },
      select: ClientAttachmentSelect,
    });
  }

  public async save(data: CreateClientAttachmentInputDto & { link: string }): Promise<number> {
    const result = await this.prisma.clientAttachment.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditClientAttachmentInputDto & { link?: string }): Promise<void> {
    await this.prisma.clientAttachment.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientAttachment.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientAttachment.update({
      where: { id },
      data: { active },
    });
  }
}
