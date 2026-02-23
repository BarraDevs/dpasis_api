import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { ICepLookupGateway } from '../../cep-lookup.gateway';
import { CepLookupOutputDto } from '../../dtos/cep-lookup.dto';
import { ViacepOutputDto } from './dtos/viacep.dto';

@Injectable()
export class CepLookupViacepAdapterGateway implements ICepLookupGateway {
  private readonly CEP_LENGTH = 8;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  public async lookup(cep: string): Promise<CepLookupOutputDto> {
    const normalizedCep = cep.replace(/\D/g, '');
    if (normalizedCep.length !== this.CEP_LENGTH) {
      throw new ExternalApiError('CEP inválido');
    }

    try {
      const result = await this.httpService.axiosRef.get<ViacepOutputDto>(
        `${this.configService.viacepApiUrl}/${normalizedCep}/json/`,
      );

      if (result.data?.erro === true) {
        throw new ExternalApiError('CEP não encontrado');
      }

      if (!result.data?.cep) {
        throw new ExternalApiError('CEP não encontrado');
      }

      return {
        zipCode: result.data.cep,
        street: result.data.logradouro ?? '',
        complement: result.data.complemento?.trim() || null,
        neighborhood: result.data.bairro ?? '',
        city: result.data.localidade ?? '',
        state: result.data.uf ?? '',
      };
    }
    catch (error) {
      this.logger.error(LogContext.CEP_LOOKUP, {
        adapter: 'viacep',
        cep: normalizedCep,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao buscar CEP');
    }
  }
}
