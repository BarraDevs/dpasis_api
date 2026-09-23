import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EmailTemplateDto } from 'src/app/global/email-template/application/dtos/email-template.dto';
import { IEmailTemplateDao } from 'src/app/global/email-template/application/persistence/dao/email-template-dao.interface';
import { CreateEmailTemplateInputDto } from 'src/app/global/email-template/application/usecases/create-email-template/dtos/create-email-template.dto';
import { EditEmailTemplateInputDto } from 'src/app/global/email-template/application/usecases/edit-email-template/dtos/edit-email-template.dto';
import { FindAllEmailTemplateQueryDto } from 'src/app/global/email-template/application/usecases/find-all-email-template/dtos/find-all-email-template.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const EmailTemplateSelect = {
  id: true,
  name: true,
  description: true,
  subject: true,
  html: true,
  css: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EmailTemplateSelect;

@Injectable()
export class EmailTemplateDaoAdapterPrisma implements IEmailTemplateDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllEmailTemplateQueryDto): Promise<[EmailTemplateDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.EmailTemplateWhereInput[] = [];

    if (queries.search?.trim()) {
      const search = queries.search.trim();
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.EmailTemplateWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.emailTemplate.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: EmailTemplateSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailTemplate.count({ where }),
    ]);

    return [rows, total];
  }

  public async findById(id: number): Promise<EmailTemplateDto | null> {
    return this.prisma.emailTemplate.findUnique({
      where: { id },
      select: EmailTemplateSelect,
    });
  }

  public async findByName(name: string): Promise<EmailTemplateDto | null> {
    return this.prisma.emailTemplate.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: EmailTemplateSelect,
    });
  }

  public async save(data: CreateEmailTemplateInputDto): Promise<number> {
    const result = await this.prisma.emailTemplate.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        subject: data.subject,
        html: data.html,
        css: data.css,
      },
    });

    return result.id;
  }

  public async edit(id: number, data: EditEmailTemplateInputDto): Promise<void> {
    await this.prisma.emailTemplate.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.emailTemplate.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.emailTemplate.update({
      where: { id },
      data: { active },
    });
  }
}
