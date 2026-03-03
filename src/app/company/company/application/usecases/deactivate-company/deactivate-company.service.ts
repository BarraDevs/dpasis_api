import { Inject, Injectable } from '@nestjs/common';
import { CompanyNotFoundError } from 'src/app/company/company/domain/errors/company-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ICompanyRepository } from '../../persistence/repository/company-repository.interface';

@Injectable()
export class DeactivateCompany {
  constructor(
    @Inject(TOKENS.CompanyRepository) private readonly companyRepository: ICompanyRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new CompanyNotFoundError();
    }

    company.deactivate();
    await this.companyRepository.edit(company);

    return { message: 'Empresa desativada com sucesso' };
  }
}
