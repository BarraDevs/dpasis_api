import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { Shipper } from 'src/app/shipper/domain/entities/shipper.entity';
import { ShipperDuplicateCnpjError } from 'src/app/shipper/domain/errors/duplicate-cnpj.error';
import { TOKENS } from 'src/core/di/token';
import type { IShipperDao } from '../../persistence/dao/shipper-dao.interface';
import type { IShipperRepository } from '../../persistence/repository/shipper-repository.interface';
import { CreateShipperInputDto, CreateShipperOutputDto } from './dtos/create-shipper.dto';

@Injectable()
export class CreateShipper {
  constructor(
    @Inject(TOKENS.ShipperDao) private readonly shipperDao: IShipperDao,
    @Inject(TOKENS.ShipperRepository) private readonly shipperRepository: IShipperRepository,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(data: CreateShipperInputDto): Promise<CreateShipperOutputDto> {
    const shipper = Shipper.create(data);

    const duplicateCnpj = await this.shipperDao.findByCnpj(shipper.props.cnpj);
    if (duplicateCnpj) {
      throw new ShipperDuplicateCnpjError();
    }

    // Verify if each company exists
    await Promise.all(
      shipper.props.companyIds.map(
        async(companyId) => this.findCompanyById.execute(companyId),
      ),
    );

    await this.shipperRepository.save(shipper);

    return { id: shipper.props.id };
  }
}
