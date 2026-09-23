import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EmailTemplateVariableDto } from 'src/app/global/email-template-variable/application/dtos/email-template-variable.dto';
import { IEmailTemplateVariableDao } from 'src/app/global/email-template-variable/application/persistence/dao/email-template-variable-dao.interface';
import { CreateEmailTemplateVariableInputDto } from 'src/app/global/email-template-variable/application/usecases/create-email-template-variable/dtos/create-email-template-variable.dto';
import { EditEmailTemplateVariableInputDto } from 'src/app/global/email-template-variable/application/usecases/edit-email-template-variable/dtos/edit-email-template-variable.dto';
import { FindAllEmailTemplateVariableQueryDto } from 'src/app/global/email-template-variable/application/usecases/find-all-email-template-variable/dtos/find-all-email-template-variable.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const EmailTemplateVariableSelect = {
  id: true,
  key: true,
  label: true,
  example: true,
  description: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EmailTemplateVariableSelect;

@Injectable()
export class EmailTemplateVariableDaoAdapterPrisma implements IEmailTemplateVariableDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllEmailTemplateVariableQueryDto): Promise<[EmailTemplateVariableDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.EmailTemplateVariableWhereInput[] = [];

    if (queries.search?.trim()) {
      const search = queries.search.trim();
      conditions.push({
        OR: [
          { key: { contains: search, mode: 'insensitive' } },
          { label: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.EmailTemplateVariableWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.emailTemplateVariable.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: EmailTemplateVariableSelect,
        orderBy: { key: 'asc' },
      }),
      this.prisma.emailTemplateVariable.count({ where }),
    ]);

    return [rows, total];
  }

  public async findById(id: number): Promise<EmailTemplateVariableDto | null> {
    return this.prisma.emailTemplateVariable.findUnique({
      where: { id },
      select: EmailTemplateVariableSelect,
    });
  }

  public async findByKey(key: string): Promise<EmailTemplateVariableDto | null> {
    return this.prisma.emailTemplateVariable.findUnique({
      where: { key },
      select: EmailTemplateVariableSelect,
    });
  }

  public async findActiveByKeys(keys: string[]): Promise<EmailTemplateVariableDto[]> {
    if (keys.length === 0) {
      return [];
    }

    return this.prisma.emailTemplateVariable.findMany({
      where: {
        key: { in: keys },
        active: true,
      },
      select: EmailTemplateVariableSelect,
    });
  }

  public async save(data: CreateEmailTemplateVariableInputDto): Promise<number> {
    const result = await this.prisma.emailTemplateVariable.create({
      data: {
        key: data.key,
        label: data.label,
        example: data.example ?? null,
        description: data.description ?? null,
      },
    });

    return result.id;
  }

  public async edit(id: number, data: EditEmailTemplateVariableInputDto): Promise<void> {
    await this.prisma.emailTemplateVariable.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.emailTemplateVariable.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.emailTemplateVariable.update({
      where: { id },
      data: { active },
    });
  }
}
