import { Inject, Injectable } from '@nestjs/common';
import { BudgetLockedError } from 'src/app/budget/domain/errors/budget-locked.error';
import { BudgetNotFoundError } from 'src/app/budget/domain/errors/budget-not-found.error';
import { StockValidator } from 'src/app/budget/domain/services/stock-validator/stock-validator.service';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { FindOrderByBudgetId } from 'src/app/order/application/usecases/find-order-by-budget-id/find-order-by-budget-id.service';
import type { IProductRepository } from 'src/app/product/application/persistence/repository/product-repository.interface';
import { FindSellerById } from 'src/app/seller/application/usecases/find-seller-by-id/find-seller-by-id.service';
import { SellerNotActiveError } from 'src/app/seller/domain/errors/seller-not-active.error';
import type { IServiceRepository } from 'src/app/service/application/persistence/repository/service-repository.interface';
import { FindShipperById } from 'src/app/shipper/application/usecases/find-shipper-by-id/find-shipper-by-id.service';
import { ShipperNotActiveError } from 'src/app/shipper/domain/errors/shipper-not-active.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IBudgetRepository } from '../../persistence/repository/budget-repository.interface';
import { EditBudgetInputDto } from './dtos/edit-budget.dto';

@Injectable()
export class EditBudget {
  constructor(
    @Inject(TOKENS.BudgetRepository) private readonly budgetRepo: IBudgetRepository,
    @Inject(TOKENS.ProductRepository) private readonly productRepository: IProductRepository,
    @Inject(TOKENS.ServiceRepository) private readonly serviceRepository: IServiceRepository,
    private readonly findOrderByBudgetId: FindOrderByBudgetId,
    private readonly findCompanyById: FindCompanyById,
    private readonly findSellerById: FindSellerById,
    private readonly findShipperById: FindShipperById,
    private readonly stockValidator: StockValidator,
  ) {}

  public async execute(id: string, data: EditBudgetInputDto): Promise<SuccessMessage> {
    const budget = await this.budgetRepo.findById(id);
    if (!budget) {
      throw new BudgetNotFoundError();
    }

    const existingOrder = await this.findOrderByBudgetId.execute(id);
    if (existingOrder) {
      throw new BudgetLockedError();
    }

    if (data.companyId) {
      const company = await this.findCompanyById.execute(data.companyId);
      if (!company.active) {
        throw new CompanyNotActiveError(company.fantasyName);
      }
    }

    if (data.sellerId) {
      const seller = await this.findSellerById.execute(data.sellerId);
      if (!seller.active) {
        throw new SellerNotActiveError(seller.name);
      }
    }

    if (data.shipperId) {
      const shipper = await this.findShipperById.execute(data.shipperId);
      if (!shipper.active) {
        throw new ShipperNotActiveError(shipper.fantasyName);
      }
    }

    if (data.items) {
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
    }

    budget.update({
      companyId: data.companyId,
      sellerId: data.sellerId,
      freightType: data.freightType,
      shipperId: data.shipperId,
      freightValueInCents: data.freightValueInCents,
      discountInCents: data.discountInCents,
      commercialProcess: data.commercialProcess,
      commercialNote: data.commercialNote,
      observations: data.observations,
    });

    if (data.items) {
      budget.replaceItems(data.items.map((item) => ({
        itemType: item.itemType,
        productId: item.productId ?? null,
        serviceId: item.serviceId ?? null,
        description: item.description,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents,
        discountInCents: item.discountInCents,
      })));
    }

    await this.budgetRepo.edit(budget);

    return { message: 'Orçamento editado com sucesso!' };
  }
}
