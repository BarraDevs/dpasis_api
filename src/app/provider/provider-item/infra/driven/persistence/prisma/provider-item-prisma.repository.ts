import { Injectable } from '@nestjs/common';
import { IProviderItemRepository } from 'src/app/provider/provider-item/application/persistence/repository/provider-item-repository.interface';
import { ProviderItem } from 'src/app/provider/provider-item/domain/entities/provider-item.entity';
import { ProviderItemInstallmentStatus } from 'src/app/provider/provider-item/domain/enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from 'src/app/provider/provider-item/domain/enums/provider-item-schedule-type.enum';
import { ProviderItemFactory } from 'src/app/provider/provider-item/domain/factories/provider-item.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ProviderItemRepositoryAdapterPrisma implements IProviderItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: ProviderItem): Promise<number> {
    const props = entity.props;

    return this.prisma.$transaction(async(tx) => {
      const created = await tx.providerItem.create({
        data: {
          providerId: props.providerId,
          description: props.description,
          totalValueInCents: props.totalValueInCents,
          installmentsCount: props.installmentsCount,
          scheduleType: props.scheduleType,
          intervalDays: props.intervalDays,
          dueDay: props.dueDay,
          firstDueDate: props.firstDueDate,
          bankId: props.bankId,
          active: props.active,
        },
      });

      await tx.providerItemInstallment.createMany({
        data: props.installments.map((installment) => ({
          providerItemId: created.id,
          number: installment.number,
          valueInCents: installment.valueInCents,
          dueDate: installment.dueDate,
          status: installment.status,
        })),
      });

      return created.id;
    });
  }

  public async edit(entity: ProviderItem): Promise<void> {
    const props = entity.props;

    await this.prisma.$transaction(async(tx) => {
      await tx.providerItem.update({
        where: { id: props.id! },
        data: {
          description: props.description,
          totalValueInCents: props.totalValueInCents,
          installmentsCount: props.installmentsCount,
          scheduleType: props.scheduleType,
          intervalDays: props.intervalDays,
          dueDay: props.dueDay,
          firstDueDate: props.firstDueDate,
          bankId: props.bankId,
          active: props.active,
        },
      });

      const installmentsWithId = props.installments.filter((installment) => installment.id != null);
      for (const installment of installmentsWithId) {
        await tx.providerItemInstallment.update({
          where: { id: installment.id! },
          data: {
            number: installment.number,
            valueInCents: installment.valueInCents,
            dueDate: installment.dueDate,
            status: installment.status,
          },
        });
      }

      const keptIds = installmentsWithId.map((installment) => installment.id!);
      await tx.providerItemInstallment.deleteMany({
        where: {
          providerItemId: props.id!,
          status: ProviderItemInstallmentStatus.PENDING,
          ...(keptIds.length > 0 ? { id: { notIn: keptIds } } : {}),
        },
      });

      const newPendingInstallments = props.installments.filter(
        (installment) => installment.id == null && installment.status === ProviderItemInstallmentStatus.PENDING,
      );

      if (newPendingInstallments.length > 0) {
        await tx.providerItemInstallment.createMany({
          data: newPendingInstallments.map((installment) => ({
            providerItemId: props.id!,
            number: installment.number,
            valueInCents: installment.valueInCents,
            dueDate: installment.dueDate,
            status: installment.status,
          })),
        });
      }
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.providerItem.update({
      where: { id },
      data: { active },
    });
  }

  public async findById(id: number): Promise<ProviderItem | null> {
    const data = await this.prisma.providerItem.findUnique({
      where: { id },
      include: {
        installments: {
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!data) {
      return null;
    }

    return ProviderItemFactory.load({
      id: data.id,
      providerId: data.providerId,
      description: data.description,
      totalValueInCents: data.totalValueInCents,
      installmentsCount: data.installmentsCount,
      scheduleType: data.scheduleType as ProviderItemScheduleType,
      intervalDays: data.intervalDays,
      dueDay: data.dueDay,
      firstDueDate: data.firstDueDate,
      bankId: data.bankId,
      active: data.active,
      installments: data.installments.map((installment) => ({
        id: installment.id,
        number: installment.number,
        valueInCents: installment.valueInCents,
        dueDate: installment.dueDate,
        status: installment.status as ProviderItemInstallmentStatus,
      })),
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.providerItem.delete({
      where: { id },
    });
  }
}
