import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { IssueNfInputDto } from '../../../dtos/issue-nf.dto';

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
