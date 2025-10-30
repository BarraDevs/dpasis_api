import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AttachmentDto } from 'src/app/attachment/application/dtos/attachment.dto';
import { IAttachmentDao } from 'src/app/attachment/application/persistence/dao/attachment-dao.interface';
import { CreateAttachmentInputDto } from 'src/app/attachment/application/usecases/create-attachment/dtos/create-attachment.dto';
import { EditAttachmentInputDto } from 'src/app/attachment/application/usecases/edit-attachment/dtos/edit-attachment.dto';
import { FindAllAttachmentQueryDto } from 'src/app/attachment/application/usecases/find-all-attachment/dtos/find-all-attachment.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class AttachmentDaoAdapterPrisma implements IAttachmentDao {
  constructor(private prisma: PrismaService) {}

  public async save(data: CreateAttachmentInputDto): Promise<string> {
    const result = await this.prisma.attachment.create({
      data,
    });

    return result.id;
  }

  public async findAll(queries: FindAllAttachmentQueryDto): Promise<[AttachmentDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.AttachmentWhereInput = {
      AND: [
        {
          OR: [
            { field: { contains: queries.search } },
          ],
        },
      ],
    };

    return this.prisma.$transaction([
      this.prisma.attachment.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.attachment.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<AttachmentDto | null> {
    return this.prisma.attachment.findUnique({
      where: { id },
    });
  }

  public async edit(id: string, data: EditAttachmentInputDto): Promise<void> {
    await this.prisma.attachment.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.attachment.delete({
      where: { id },
    });
  }
}
