import { Props } from 'scripts/generate-module';

export function generateDaoFile({ moduleName, moduleNameCamel, moduleNamePascal }: Props) {
  return `import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { I${moduleNamePascal}Dao } from '../../application/persistence/dao/${moduleName}-dao.interface';
import { Create${moduleNamePascal}InputDto } from '../../application/usecases/create-${moduleName}/dtos/create-${moduleName}.dto';
import { Edit${moduleNamePascal}InputDto } from '../../application/usecases/edit-${moduleName}/dtos/edit-${moduleName}.dto';
import { FindAll${moduleNamePascal}QueryDto } from '../../application/usecases/find-all-${moduleName}/dtos/find-all-${moduleName}.dto';

@Injectable()
export class ${moduleNamePascal}DaoAdapterPrisma implements I${moduleNamePascal}Dao {
  constructor(private prisma: PrismaService) {}

  public save(data: Create${moduleNamePascal}InputDto) {
    return this.prisma.${moduleNameCamel}.create({
      data,
    });
  }

  public findAll(queries: FindAll${moduleNamePascal}QueryDto) {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.${moduleNamePascal}WhereInput = {
      AND: [
        {
          OR: [
            { field: { contains: queries.search } },
          ],
        },
      ],
    };

    return this.prisma.$transaction([
      this.prisma.${moduleNameCamel}.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.${moduleNameCamel}.count({ where }),
    ]);
  }

  public findById(id: string) {
    return this.prisma.${moduleNameCamel}.findUnique({
      where: { id },
    });
  }

  public edit(id: string, data: Edit${moduleNamePascal}InputDto) {
    return this.prisma.${moduleNameCamel}.update({
      where: { id },
      data,
    });
  }

  public delete(id: string) {
    return this.prisma.${moduleNameCamel}.delete({
      where: { id },
    });
  }
}
`;
}
