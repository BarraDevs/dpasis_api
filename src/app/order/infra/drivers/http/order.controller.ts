import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import type { Payload } from 'src/app/authentication/domain/types/payload.type';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { User } from 'src/app/authentication/infra/decorators/user.decorator';
import { OrderDto } from 'src/app/order/application/dtos/order.dto';
import { CancelOrder } from 'src/app/order/application/usecases/cancel-order/cancel-order.service';
import { CancelOrderInputDto } from 'src/app/order/application/usecases/cancel-order/dtos/cancel-order.dto';
import { DeliverOrder } from 'src/app/order/application/usecases/deliver-order/deliver-order.service';
import { DeliverOrderInputDto } from 'src/app/order/application/usecases/deliver-order/dtos/deliver-order.dto';
import { FindAllOrdersQueryDto } from 'src/app/order/application/usecases/find-all-orders/dtos/find-all-orders.dto';
import { FindAllOrders } from 'src/app/order/application/usecases/find-all-orders/find-all-orders.service';
import { FindOrderById } from 'src/app/order/application/usecases/find-order-by-id/find-order-by-id.service';
import { InvoiceOrderInputDto } from 'src/app/order/application/usecases/invoice-order/dtos/invoice-order.dto';
import { InvoiceOrder } from 'src/app/order/application/usecases/invoice-order/invoice-order.service';
import { ShipOrderInputDto } from 'src/app/order/application/usecases/ship-order/dtos/ship-order.dto';
import { ShipOrder } from 'src/app/order/application/usecases/ship-order/ship-order.service';
import { StartProductionInputDto } from 'src/app/order/application/usecases/start-production/dtos/start-production.dto';
import { StartProduction } from 'src/app/order/application/usecases/start-production/start-production.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('orders')
@RequiredRoles(AccountRole.ADMIN)
export class OrderController {
  constructor(
    private readonly findAllOrdersService: FindAllOrders,
    private readonly findOrderByIdService: FindOrderById,
    private readonly startProductionService: StartProduction,
    private readonly invoiceOrderService: InvoiceOrder,
    private readonly shipOrderService: ShipOrder,
    private readonly deliverOrderService: DeliverOrder,
    private readonly cancelOrderService: CancelOrder,
  ) {}

  @Get()
  @Swagger({
    tags: ['Pedidos'],
    summary: 'Lista pedidos com filtros e paginação',
    applyBadRequest: true,
    okPaginatedResponse: OrderDto,
  })
  public findAll(@Query() queries: FindAllOrdersQueryDto): Promise<IPagination<OrderDto>> {
    return this.findAllOrdersService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Pedidos'],
    summary: 'Busca pedido por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: OrderDto,
  })
  public findOne(@Param() params: Params): Promise<OrderDto> {
    return this.findOrderByIdService.execute(params.id);
  }

  @Patch(':id/start-production')
  @Swagger({
    tags: ['Pedidos'],
    summary: 'Inicia produção do pedido (CREATED → PRODUCTION)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public startProduction(@Param() params: Params, @User() user: Payload, @Body() body: StartProductionInputDto): Promise<SuccessMessage> {
    return this.startProductionService.execute(params.id, user.sub, body);
  }

  @Patch(':id/invoice')
  @Swagger({
    tags: ['Pedidos'],
    summary: 'Fatura o pedido (PRODUCTION → INVOICED)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public invoice(@Param() params: Params, @User() user: Payload, @Body() body: InvoiceOrderInputDto): Promise<SuccessMessage> {
    return this.invoiceOrderService.execute(params.id, user.sub, body);
  }

  @Patch(':id/ship')
  @Swagger({
    tags: ['Pedidos'],
    summary: 'Envia o pedido (INVOICED → SHIPPED)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public ship(@Param() params: Params, @User() user: Payload, @Body() body: ShipOrderInputDto): Promise<SuccessMessage> {
    return this.shipOrderService.execute(params.id, user.sub, body);
  }

  @Patch(':id/deliver')
  @Swagger({
    tags: ['Pedidos'],
    summary: 'Marca o pedido como entregue (SHIPPED → DELIVERED)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deliver(@Param() params: Params, @User() user: Payload, @Body() body: DeliverOrderInputDto): Promise<SuccessMessage> {
    return this.deliverOrderService.execute(params.id, user.sub, body);
  }

  @Patch(':id/cancel')
  @Swagger({
    tags: ['Pedidos'],
    summary: 'Cancela o pedido (qualquer status → CANCELLED, exceto DELIVERED)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public cancel(@Param() params: Params, @User() user: Payload, @Body() body: CancelOrderInputDto): Promise<SuccessMessage> {
    return this.cancelOrderService.execute(params.id, user.sub, body);
  }
}
