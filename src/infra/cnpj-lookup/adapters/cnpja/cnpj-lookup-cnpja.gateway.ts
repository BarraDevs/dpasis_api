import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { CNPJ } from 'src/shared/value-objects/cnpj/cnpj.vo';
import { ICnpjLookupGateway } from '../../cnpj-lookup.gateway';
import { CnpjLookupOutputDto } from '../../dtos/cnpj-lookup.dto';
import { CnpjaOutputDto } from './dtos/cnpja.dto';

@Injectable()
export class CnpjLookupCnpjaAdapterGateway implements ICnpjLookupGateway {
  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  public async lookup(cnpj: string): Promise<CnpjLookupOutputDto> {
    const validCnpj = new CNPJ(cnpj).value;

    try {
      const result = await this.httpService.axiosRef.get<CnpjaOutputDto>(`${this.configService.cnpjaApiUrl}/${validCnpj}`);

      if (!result.data?.company?.name) {
        throw new ExternalApiError('CNPJ não encontrado');
      }

      return {
        fantasyName: result.data.alias ?? '',
        companyName: result.data.company.name,
        address: {
          zipCode: result.data.address.zip,
          street: result.data.address.street,
          number: result.data.address.number,
          complement: result.data.address.details,
          neighborhood: result.data.address.district,
          city: result.data.address.city,
          state: result.data.address.state,
        },
      };
    }
    catch (error) {
      this.logger.error(LogContext.CNPJ_LOOKUP, {
        adapter: 'cnpja',
        cnpj,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao buscar CNPJ');
    }
  }
}
