import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderDto, OrderStatusHistoryDto } from 'src/app/order/application/dtos/order.dto';
import { FindAllOrderFilters, IOrderDao } from 'src/app/order/application/persistence/dao/order-dao.interface';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const orderSelect = {
  id: true,
  budgetId: true,
  status: true,
  trackingCode: true,
  statusHistory: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  cancelledAt: true,
  cancelledBy: true,
  cancellationReason: true,
} satisfies Prisma.OrderSelect;

type OrderPayload = Prisma.OrderGetPayload<{select: typeof orderSelect}>;

@Injectable()
export class OrderDaoAdapterPrisma implements IOrderDao {
  constructor(private prisma: PrismaService) {}

  private mapToDto(order: OrderPayload): OrderDto {
    const statusHistory = Array.isArray(order.statusHistory)
      ? order.statusHistory
      : JSON.parse(order.statusHistory as string || '[]');

    const statusHistoryDto: OrderStatusHistoryDto[] = statusHistory.map((history: any) => ({
      status: history.status,
      changedAt: history.changedAt,
      changedBy: history.changedBy,
      observation: history.observation,
    }));

    return {
      id: order.id,
      budgetId: order.budgetId,
      status: order.status,
      trackingCode: order.trackingCode,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      createdBy: order.createdBy,
      cancelledAt: order.cancelledAt,
      cancelledBy: order.cancelledBy,
      cancellationReason: order.cancellationReason,
      statusHistory: statusHistoryDto,
    };
  }

  public async findAll(filters: FindAllOrderFilters): Promise<[OrderDto[], number]> {
    const pagination = this.prisma.paginationFactory(filters.page, filters.limit);

    const where: Prisma.OrderWhereInput = {
      AND: [
        { status: filters.status ? { equals: filters.status } : undefined },
        {
          budget: {
            clientId: filters.clientId ? { equals: filters.clientId } : undefined,
            sellerId: filters.sellerId ? { equals: filters.sellerId } : undefined,
            companyId: filters.companyId ? { equals: filters.companyId } : undefined,
          },
        },
        {
          createdAt: filters.dateFrom || filters.dateTo
            ? { gte: filters.dateFrom, lte: filters.dateTo }
            : undefined,
        },
      ],
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        select: orderSelect,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return [orders.map(this.mapToDto), total];
  }

  public async findById(id: string): Promise<OrderDto | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: orderSelect,
    });

    if (!order) {
      return null;
    }

    return this.mapToDto(order);
  }
}
