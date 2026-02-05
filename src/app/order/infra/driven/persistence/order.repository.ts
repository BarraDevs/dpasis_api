import { Injectable } from '@nestjs/common';
import { IOrderRepository } from 'src/app/order/application/persistence/repository/order-repository.interface';
import { Order } from 'src/app/order/domain/entities/order.entity';
import { OrderStatusHistory } from 'src/app/order/domain/value-objects/order-status-history.vo';
import { OrderStatus } from 'src/app/order/enums/order-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class OrderRepositoryAdapterPrisma implements IOrderRepository {
  constructor(private prisma: PrismaService) {}

  private mapToEntity(orderRecord: any): Order {
    const statusHistoryData = Array.isArray(orderRecord.statusHistory)
      ? orderRecord.statusHistory
      : JSON.parse(orderRecord.statusHistory);

    const statusHistory = statusHistoryData.map((history: any) =>
      OrderStatusHistory.load({
        status: history.status as OrderStatus,
        changedAt: new Date(history.changedAt),
        changedBy: history.changedBy,
        observation: history.observation,
      })
    );

    return Order.load(
      {
        id: orderRecord.id,
        budgetId: orderRecord.budgetId,
        status: orderRecord.status as OrderStatus,
        trackingCode: orderRecord.trackingCode,
        createdAt: orderRecord.createdAt,
        updatedAt: orderRecord.updatedAt,
        createdBy: orderRecord.createdBy,
        cancelledAt: orderRecord.cancelledAt,
        cancelledBy: orderRecord.cancelledBy,
        cancellationReason: orderRecord.cancellationReason,
      },
      statusHistory
    );
  }

  public async findById(id: string): Promise<Order | null> {
    const orderRecord = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!orderRecord) {
      return null;
    }

    return this.mapToEntity(orderRecord);
  }

  public async findByBudgetId(budgetId: string): Promise<Order | null> {
    const orderRecord = await this.prisma.order.findUnique({
      where: { budgetId },
    });

    if (!orderRecord) {
      return null;
    }

    return this.mapToEntity(orderRecord);
  }

  public async save(order: Order): Promise<void> {
    await this.prisma.order.create({
      data: {
        id: order.props.id,
        budgetId: order.props.budgetId,
        status: order.props.status,
        trackingCode: order.props.trackingCode,
        createdAt: order.props.createdAt,
        updatedAt: order.props.updatedAt,
        createdBy: order.props.createdBy,
        cancelledAt: order.props.cancelledAt,
        cancelledBy: order.props.cancelledBy,
        cancellationReason: order.props.cancellationReason,
        statusHistory: order.statusHistory.map((history) => history.toJSON()),
      },
    });
  }

  public async edit(order: Order): Promise<void> {
    await this.prisma.order.update({
      where: { id: order.props.id },
      data: {
        status: order.props.status,
        trackingCode: order.props.trackingCode,
        updatedAt: order.props.updatedAt,
        cancelledAt: order.props.cancelledAt,
        cancelledBy: order.props.cancelledBy,
        cancellationReason: order.props.cancellationReason,
        statusHistory: order.statusHistory.map((history) => history.toJSON()),
      },
    });
  }
}
