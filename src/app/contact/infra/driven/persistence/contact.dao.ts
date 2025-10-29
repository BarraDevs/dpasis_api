import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ContactDto } from 'src/app/contact/application/dtos/contact.dto';
import { IContactDao } from 'src/app/contact/application/persistence/dao/contact-dao.interface';
import { CreateContactInputDto } from 'src/app/contact/application/usecases/create-contact/dtos/create-contact.dto';
import { EditContactInputDto } from 'src/app/contact/application/usecases/edit-contact/dtos/edit-contact.dto';
import { FindAllContactQueryDto } from 'src/app/contact/application/usecases/find-all-contact/dtos/find-all-contact.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ContactDaoAdapterPrisma implements IContactDao {
  constructor(private prisma: PrismaService) {}

  public async save(data: CreateContactInputDto): Promise<string> {
    const result = await this.prisma.contact.create({
      data,
    });

    return result.id;
  }

  public async findAll(queries: FindAllContactQueryDto): Promise<[ContactDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ContactWhereInput = {
      ownerId: queries.ownerId,
    };

    return this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { name: 'asc' },
      }),
      this.prisma.contact.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<ContactDto | null> {
    return this.prisma.contact.findUnique({
      where: { id },
    });
  }

  public async edit(id: string, data: EditContactInputDto): Promise<void> {
    await this.prisma.contact.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.contact.delete({
      where: { id },
    });
  }
}
