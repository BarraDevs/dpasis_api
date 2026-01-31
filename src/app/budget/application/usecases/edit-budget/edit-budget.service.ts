import { Inject, Injectable } from '@nestjs/common';
import { BudgetNotFoundError } from 'src/app/budget/domain/errors/budget-not-found.error';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { FindClientById } from 'src/app/client/application/usecases/find-client-by-id/find-client-by-id.service';
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
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IBudgetRepository } from '../../persistence/repository/budget-repository.interface';
import { EditBudgetInputDto } from './dtos/edit-budget.dto';

@Injectable()
export class EditBudget {
  constructor(
    @Inject(TOKENS.BudgetRepository) private readonly budgetRepo: IBudgetRepository,
    private readonly findCompanyById: FindCompanyById,
    private readonly findClientById: FindClientById,
    private readonly findSellerById: FindSellerById,
    private readonly findShipperById: FindShipperById,
    private readonly findProductById: FindProductById,
    private readonly findServiceById: FindServiceById,
  ) {}

  public async execute(id: string, data: EditBudgetInputDto): Promise<SuccessMessage> {
    const budget = await this.budgetRepo.findById(id);
    if (!budget) {
      throw new BudgetNotFoundError();
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
      for (const item of data.items) {
        if (item.itemType === BudgetItemType.PRODUCT && item.productId) {
          const product = await this.findProductById.execute(item.productId);
          if (product.currentStock < item.quantity) {
            throw new ProductOutOfStockError(product.description);
          }
        } else if (item.itemType === BudgetItemType.SERVICE && item.serviceId) {
          const service = await this.findServiceById.execute(item.serviceId);
          if (!service.active) {
            throw new ServiceNotActiveError(service.name);
          }
        }
      }
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
