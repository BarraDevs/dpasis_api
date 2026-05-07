import { Injectable } from '@nestjs/common';
import { CnpjLookup } from 'src/app/external-apis/application/usecases/cnpj-lookup/cnpj-lookup.service';
import { AppException } from 'src/core/filters/app.exception';
import { CnpjLookupOutputDto } from 'src/infra/cnpj-lookup/dtos/cnpj-lookup.dto';
import { CheckClientDocumentInUse } from '../check-client-document-in-use/check-client-document-in-use.service';
import { LookupClientDocumentAndCnpjInputDto, LookupClientDocumentAndCnpjOutputDto } from './dtos/lookup-client-document-and-cnpj.dto';

@Injectable()
export class LookupClientDocumentAndCnpj {
  constructor(
    private readonly checkClientDocumentInUse: CheckClientDocumentInUse,
    private readonly cnpjLookup: CnpjLookup,
  ) {}

  public async execute(data: LookupClientDocumentAndCnpjInputDto): Promise<LookupClientDocumentAndCnpjOutputDto> {
    const [docResult, cnpjOutcome] = await Promise.all([
      this.checkClientDocumentInUse.execute({ document: data.document }),
      (async(): Promise<{ data: CnpjLookupOutputDto | null; errorMessage: string | null }> => {
        try {
          const cnpjData = await this.cnpjLookup.execute({ cnpj: data.document });
          return { data: cnpjData, errorMessage: null };
        }
        catch (error: unknown) {
          const message = error instanceof AppException ? error.message : (error instanceof Error ? error.message : 'Erro ao consultar CNPJ.');
          return { data: null, errorMessage: message };
        }
      })(),
    ]);

    return {
      documentInUse: docResult.documentInUse,
      cnpjLookup: cnpjOutcome.data,
      cnpjErrorMessage: cnpjOutcome.errorMessage,
    };
  }
}
