import { Props } from 'scripts/generate-module';

export function generateDaoFile({ moduleName, moduleNameCamel, moduleNamePascal }: Props) {
  return `import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ${moduleNamePascal}Dto } from 'src/app/${moduleName}/application/dtos/${moduleName}.dto';
import { I${moduleNamePascal}Dao } from 'src/app/${moduleName}/application/persistence/dao/${moduleName}-dao.interface';
import { Create${moduleNamePascal}InputDto } from 'src/app/${moduleName}/application/usecases/create-${moduleName}/dtos/create-${moduleName}.dto';
import { Edit${moduleNamePascal}InputDto } from 'src/app/${moduleName}/application/usecases/edit-${moduleName}/dtos/edit-${moduleName}.dto';
import { FindAll${moduleNamePascal}QueryDto } from 'src/app/${moduleName}/application/usecases/find-all-${moduleName}/dtos/find-all-${moduleName}.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ${moduleNamePascal}DaoAdapterPrisma implements I${moduleNamePascal}Dao {
  constructor(private prisma: PrismaService) {}

  public async save(data: Create${moduleNamePascal}InputDto): Promise<string> {
    const result = await this.prisma.${moduleNameCamel}.create({
      data,
    });

    return result.id;
  }

  public async findAll(queries: FindAll${moduleNamePascal}QueryDto): Promise<[${moduleNamePascal}Dto[], number]> {
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

  public async findById(id: string): Promise<${moduleNamePascal}Dto | null> {
    return this.prisma.${moduleNameCamel}.findUnique({
      where: { id },
    });
  }

  public async edit(id: string, data: Edit${moduleNamePascal}InputDto): Promise<void> {
    await this.prisma.${moduleNameCamel}.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.${moduleNameCamel}.delete({
      where: { id },
    });
  }
}
`;
}
