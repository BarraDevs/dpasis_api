import { Inject, Injectable } from '@nestjs/common';
import { BudgetItemCreateProps } from 'src/app/budget/domain/entities/budget-item.entity';
import { Budget } from 'src/app/budget/domain/entities/budget.entity';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { FindClientById } from 'src/app/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { ClientNotActiveError } from 'src/app/client/domain/errors/client-not-active.error';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { FindProductById } from 'src/app/product/application/usecases/find-product-by-id/find-product-by-id.service';
import { ProductOutOfStockError } from 'src/app/product/domain/errors/product-out-of-stock.error';
import { FindSellerById } from 'src/app/seller/application/usecases/find-seller-by-id/find-seller-by-id.service';
import { SellerNotActiveError } from 'src/app/seller/domain/errors/seller-not-active.error';
import { FindServiceById } from 'src/app/service/application/usecases/find-service-by-id/find-service-by-id.service';
import { ServiceNotActiveError } from 'src/app/service/domain/errors/service-not-active.error';
import { FindShipperById } from 'src/app/shipper/application/usecases/find-shipper-by-id/find-shipper-by-id.service';
import { ShipperNotActiveError } from 'src/app/shipper/domain/errors/shipper-not-active.error';
import { TOKENS } from 'src/core/di/token';
import type { IBudgetRepository } from '../../persistence/repository/budget-repository.interface';
import { CreateBudgetInputDto, CreateBudgetOutputDto } from './dtos/create-budget.dto';

@Injectable()
export class CreateBudget {
  constructor(
    @Inject(TOKENS.BudgetRepository) private readonly budgetRepository: IBudgetRepository,
    private readonly findCompanyById: FindCompanyById,
    private readonly findClientById: FindClientById,
    private readonly findSellerById: FindSellerById,
    private readonly findShipperById: FindShipperById,
    private readonly findProductById: FindProductById,
    private readonly findServiceById: FindServiceById,
  ) {}

  public async execute(data: CreateBudgetInputDto): Promise<CreateBudgetOutputDto> {
    // Verify if company exists and is active
    const company = await this.findCompanyById.execute(data.companyId);
    if (!company.active) {
      throw new CompanyNotActiveError(company.fantasyName);
    }

    // Verify if client exists and is active
    const client = await this.findClientById.execute(data.clientId);
    if (!client.active) {
      throw new ClientNotActiveError(client.fantasyName);
    }

    // Verify if seller exists and is active
    const seller = await this.findSellerById.execute(data.sellerId);
    if (!seller.active) {
      throw new SellerNotActiveError(seller.name);
    }

    // Verify if shipper exists (when provided)
    if (data.shipperId) {
      const shipper = await this.findShipperById.execute(data.shipperId);
      if (!shipper.active) {
        throw new ShipperNotActiveError(shipper.fantasyName);
      }
    }

    // Verify if each item's product or service exists
    for (const item of data.items) {
      if (item.itemType === BudgetItemType.PRODUCT && item.productId) {
        const product = await this.findProductById.execute(item.productId);
        if (product.currentStock < item.quantity) {
          throw new ProductOutOfStockError(product.description);
        }
      }
      else if (item.itemType === BudgetItemType.SERVICE && item.serviceId) {
        const service = await this.findServiceById.execute(item.serviceId);
        if (!service.active) {
          throw new ServiceNotActiveError(service.name);
        }
      }
    }

    // Map items to domain props
    const items: BudgetItemCreateProps[] = data.items.map((item) => ({
      itemType: item.itemType,
      productId: item.productId ?? null,
      serviceId: item.serviceId ?? null,
      description: item.description,
      quantity: item.quantity,
      unitPriceInCents: item.unitPriceInCents,
      discountInCents: item.discountInCents,
    }));

    // Create budget entity
    const budget = Budget.create({
      companyId: data.companyId,
      clientId: data.clientId,
      sellerId: data.sellerId,
      freightType: data.freightType,
      shipperId: data.shipperId ?? null,
      freightValueInCents: data.freightValueInCents,
      discountInCents: data.discountInCents,
      commercialProcess: data.commercialProcess ?? null,
      commercialNote: data.commercialNote ?? null,
      observations: data.observations ?? null,
      items,
    });

    // Save budget
    await this.budgetRepository.save(budget);

    return { id: budget.props.id };
  }
}
