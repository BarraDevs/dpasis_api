import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { Shipper } from 'src/app/shipper/domain/entities/shipper.entity';
import { ShipperDuplicateCnpjError } from 'src/app/shipper/domain/errors/duplicate-cnpj.error';
import { ShipperNotFoundError } from 'src/app/shipper/domain/errors/shipper-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IShipperDao } from '../../persistence/dao/shipper-dao.interface';
import type { IShipperRepository } from '../../persistence/repository/shipper-repository.interface';
import { EditShipperInputDto } from './dtos/edit-shipper.dto';

@Injectable()
export class EditShipper {
  constructor(
    @Inject(TOKENS.ShipperDao) private readonly shipperDao: IShipperDao,
    @Inject(TOKENS.ShipperRepository) private readonly shipperRepository: IShipperRepository,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(id: string, data: EditShipperInputDto): Promise<SuccessMessage> {
    const shipperData = await this.shipperDao.findById(id);
    if (!shipperData) {
      throw new ShipperNotFoundError();
    }

    const { companies, ...rest } = shipperData;

    const shipper = Shipper.load({
      ...rest,
      ...data,
      companyIds: data.companyIds ?? companies.map((company) => company.id),
    });

    if (data.cnpj && shipper.props.cnpj !== shipperData.cnpj) {
      const duplicate = await this.shipperDao.findByCnpj(data.cnpj);
      if (duplicate) {
        throw new ShipperDuplicateCnpjError();
      }
    }

    if (data.companyIds) {
      await Promise.all(
        shipper.props.companyIds.map(
          async(companyId) => await this.findCompanyById.execute(companyId),
        ),
      );
    }

    await this.shipperRepository.edit(shipper);

    return { message: 'Transportadora atualizada com sucesso!' };
  }
}
