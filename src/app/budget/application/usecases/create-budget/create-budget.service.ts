import { Inject, Injectable } from '@nestjs/common';
import { BudgetItemCreateProps } from 'src/app/budget/domain/entities/budget-item.entity';
import { Budget } from 'src/app/budget/domain/entities/budget.entity';
import { StockValidator } from 'src/app/budget/domain/services/stock-validator/stock-validator.service';
import { FindClientById } from 'src/app/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { ClientNotActiveError } from 'src/app/client/domain/errors/client-not-active.error';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import type { IProductRepository } from 'src/app/product/application/persistence/repository/product-repository.interface';
import { FindSellerById } from 'src/app/seller/application/usecases/find-seller-by-id/find-seller-by-id.service';
import { SellerNotActiveError } from 'src/app/seller/domain/errors/seller-not-active.error';
import type { IServiceRepository } from 'src/app/service/application/persistence/repository/service-repository.interface';
import { FindShipperById } from 'src/app/shipper/application/usecases/find-shipper-by-id/find-shipper-by-id.service';
import { ShipperNotActiveError } from 'src/app/shipper/domain/errors/shipper-not-active.error';
import { TOKENS } from 'src/core/di/token';
import type { IBudgetRepository } from '../../persistence/repository/budget-repository.interface';
import { CreateBudgetInputDto, CreateBudgetOutputDto } from './dtos/create-budget.dto';

@Injectable()
export class CreateBudget {
  constructor(
    @Inject(TOKENS.BudgetRepository) private readonly budgetRepository: IBudgetRepository,
    @Inject(TOKENS.ProductRepository) private readonly productRepository: IProductRepository,
    @Inject(TOKENS.ServiceRepository) private readonly serviceRepository: IServiceRepository,
    private readonly findCompanyById: FindCompanyById,
    private readonly findClientById: FindClientById,
    private readonly findSellerById: FindSellerById,
    private readonly findShipperById: FindShipperById,
    private readonly stockValidator: StockValidator,
  ) {}

  public async execute(data: CreateBudgetInputDto): Promise<CreateBudgetOutputDto> {
    const company = await this.findCompanyById.execute(data.companyId);
    if (!company.active) {
      throw new CompanyNotActiveError(company.fantasyName);
    }

    const client = await this.findClientById.execute(data.clientId);
    if (!client.active) {
      throw new ClientNotActiveError(client.fantasyName);
    }

    const seller = await this.findSellerById.execute(data.sellerId);
    if (!seller.active) {
      throw new SellerNotActiveError(seller.name);
    }

    if (data.shipperId) {
      const shipper = await this.findShipperById.execute(data.shipperId);
      if (!shipper.active) {
        throw new ShipperNotActiveError(shipper.fantasyName);
      }
    }

    // check if products have stock and services are active
    await this.stockValidator.validate(
      data.items.map((item) => ({
        itemType: item.itemType,
        productId: item.productId ?? null,
        serviceId: item.serviceId ?? null,
        quantity: item.quantity,
      })),
      this.productRepository,
      this.serviceRepository,
    );

    const items: BudgetItemCreateProps[] = data.items.map((item) => ({
      itemType: item.itemType,
      productId: item.productId ?? null,
      serviceId: item.serviceId ?? null,
      description: item.description,
      quantity: item.quantity,
      unitPriceInCents: item.unitPriceInCents,
      discountInCents: item.discountInCents,
    }));

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

    await this.budgetRepository.save(budget);

    return { id: budget.props.id };
  }
}
