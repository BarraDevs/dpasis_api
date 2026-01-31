import { Injectable } from '@nestjs/common';
import { IBudgetRepository } from 'src/app/budget/application/persistence/repository/budget-repository.interface';
import { BudgetItem } from 'src/app/budget/domain/entities/budget-item.entity';
import { Budget } from 'src/app/budget/domain/entities/budget.entity';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class BudgetRepositoryAdapterPrisma implements IBudgetRepository {
  constructor(private prisma: PrismaService) {}

  public async findById(id: string): Promise<Budget | null> {
    const budgetRecord = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!budgetRecord) {
      return null;
    }

    return Budget.load(
      {
        id: budgetRecord.id,
        companyId: budgetRecord.companyId,
        clientId: budgetRecord.clientId,
        sellerId: budgetRecord.sellerId,
        freightType: budgetRecord.freightType,
        shipperId: budgetRecord.shipperId,
        freightValueInCents: budgetRecord.freightValueInCents,
        subtotalInCents: budgetRecord.subtotalInCents,
        discountInCents: budgetRecord.discountInCents,
        totalInCents: budgetRecord.totalInCents,
        commercialProcess: budgetRecord.commercialProcess,
        commercialNote: budgetRecord.commercialNote,
        observations: budgetRecord.observations,
        status: budgetRecord.status as BudgetStatus,
        approvedBy: budgetRecord.approvedBy,
        approvedAt: budgetRecord.approvedAt,
        rejectedBy: budgetRecord.rejectedBy,
        rejectedAt: budgetRecord.rejectedAt,
        rejectionReason: budgetRecord.rejectionReason,
        createdAt: budgetRecord.createdAt,
        updatedAt: budgetRecord.updatedAt,
      },
      budgetRecord.items.map((item) => {
        return BudgetItem.load({
          ...item,
          itemType: item.itemType as BudgetItemType,
        });
      })
    );
  }

  public async save(budget: Budget): Promise<void> {
    await this.prisma.budget.create({
      data: {
        id: budget.props.id,
        companyId: budget.props.companyId,
        clientId: budget.props.clientId,
        sellerId: budget.props.sellerId,
        freightType: budget.props.freightType,
        shipperId: budget.props.shipperId,
        freightValueInCents: budget.props.freightValueInCents,
        subtotalInCents: budget.props.subtotalInCents,
        discountInCents: budget.props.discountInCents,
        totalInCents: budget.props.totalInCents,
        commercialProcess: budget.props.commercialProcess,
        commercialNote: budget.props.commercialNote,
        observations: budget.props.observations,
        status: budget.props.status,
        approvedBy: budget.props.approvedBy,
        approvedAt: budget.props.approvedAt,
        rejectedBy: budget.props.rejectedBy,
        rejectedAt: budget.props.rejectedAt,
        rejectionReason: budget.props.rejectionReason,
        createdAt: budget.props.createdAt,
        updatedAt: budget.props.updatedAt,
        items: {
          createMany: {
            data: budget.items.map((item) => ({
              id: item.props.id,
              itemType: item.props.itemType,
              productId: item.props.productId,
              serviceId: item.props.serviceId,
              description: item.props.description,
              quantity: item.props.quantity,
              unitPriceInCents: item.props.unitPriceInCents,
              discountInCents: item.props.discountInCents,
              subtotalInCents: item.props.subtotalInCents,
              createdAt: item.props.createdAt,
              updatedAt: item.props.updatedAt,
            })),
          },
        },
      },
    });
  }

  public async edit(budget: Budget): Promise<void> {
    await this.prisma.$transaction(async(tx) => {
      // Atualizar dados do budget
      await tx.budget.update({
        where: { id: budget.props.id },
        data: {
          sellerId: budget.props.sellerId,
          freightType: budget.props.freightType,
          shipperId: budget.props.shipperId,
          freightValueInCents: budget.props.freightValueInCents,
          subtotalInCents: budget.props.subtotalInCents,
          discountInCents: budget.props.discountInCents,
          totalInCents: budget.props.totalInCents,
          commercialProcess: budget.props.commercialProcess,
          commercialNote: budget.props.commercialNote,
          observations: budget.props.observations,
          status: budget.props.status,
          approvedBy: budget.props.approvedBy,
          approvedAt: budget.props.approvedAt,
          rejectedBy: budget.props.rejectedBy,
          rejectedAt: budget.props.rejectedAt,
          rejectionReason: budget.props.rejectionReason,
          updatedAt: budget.props.updatedAt,
        },
      });

      // Deletar todos os items antigos
      await tx.budgetItem.deleteMany({
        where: { budgetId: budget.props.id },
      });

      // Criar novos items
      await tx.budgetItem.createMany({
        data: budget.items.map((item) => ({
          id: item.props.id,
          budgetId: budget.props.id,
          itemType: item.props.itemType,
          productId: item.props.productId,
          serviceId: item.props.serviceId,
          description: item.props.description,
          quantity: item.props.quantity,
          unitPriceInCents: item.props.unitPriceInCents,
          discountInCents: item.props.discountInCents,
          subtotalInCents: item.props.subtotalInCents,
          createdAt: item.props.createdAt,
          updatedAt: item.props.updatedAt,
        })),
      });
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.budget.delete({
      where: { id },
    });
  }
}
