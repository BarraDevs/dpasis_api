import { Injectable } from '@nestjs/common';
import { OwnerDto } from 'src/app/owner/application/dtos/owner.dto';
import { IOwnerDao } from 'src/app/owner/application/persistence/dao/owner-dao.interface';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class OwnerDaoAdapterPrisma implements IOwnerDao {
  constructor(private prisma: PrismaService) {}

  public async findById(id: string): Promise<OwnerDto | null> {
    return this.prisma.owner.findUnique({
      where: { id },
    });
  }
}
