import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { IssueNfInputDto } from '../../../dtos/issue-nf.dto';
import { NfIssueFormat } from '../../../enums/nf-issue-format.enum';

function validateNfeItems(input: IssueNfInputDto): void {
  for (const [index, item] of input.items.entries()) {
    if (!item.fiscal) {
      throw new ExternalApiError(`Item ${index + 1}: dados fiscais são obrigatórios`);
    }

    if (!item.ibsCbs) {
      throw new ExternalApiError(`Item ${index + 1}: dados de IBS/CBS são obrigatórios`);
    }

    if (!item.taxation) {
      throw new ExternalApiError(`Item ${index + 1}: dados de tributação são obrigatórios`);
    }
  }
}

function validateNfseItems(input: IssueNfInputDto): void {
  if (!input.emitter.municipalRegistration?.trim()) {
    throw new ExternalApiError('Emitente: inscrição municipal é obrigatória para NFS-e');
  }

  for (const [index, item] of input.items.entries()) {
    if (!item.taxation) {
      throw new ExternalApiError(`Item ${index + 1}: dados de tributação são obrigatórios`);
    }

    if (!item.taxation.serviceListItem?.trim()) {
      throw new ExternalApiError(`Item ${index + 1}: item da lista de serviço (LC 116) é obrigatório para NFS-e`);
    }

    if (!item.taxation.cnaeCode?.trim()) {
      throw new ExternalApiError(`Item ${index + 1}: código CNAE é obrigatório para NFS-e`);
    }

    if (!item.taxation.nbsCode?.trim()) {
      throw new ExternalApiError(`Item ${index + 1}: código NBS é obrigatório para NFS-e`);
    }
  }
}

export function validateIssueNfInput(input: IssueNfInputDto): void {
  if (!input.emitter) {
    throw new ExternalApiError('Emitente é obrigatório');
  }

  if (!input.recipient) {
    throw new ExternalApiError('Destinatário é obrigatório');
  }

  if (!input.fiscal) {
    throw new ExternalApiError('Dados fiscais complementares são obrigatórios');
  }

  if (!input.items?.length) {
    throw new ExternalApiError('A nota fiscal deve conter ao menos um item');
  }

  if (input.format === NfIssueFormat.RPS_XML) {
    validateNfseItems(input);
    return;
  }

  validateNfeItems(input);
}
