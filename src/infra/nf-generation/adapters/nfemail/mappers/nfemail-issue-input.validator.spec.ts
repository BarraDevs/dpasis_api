import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { IssueNfInputDto } from '../../../dtos/issue-nf.dto';
import { NfIssueFormat } from '../../../enums/nf-issue-format.enum';
import { makeValidIssueNfInput } from '../testing/make-valid-issue-nf-input';
import { makeValidIssueNfseInput } from '../testing/make-valid-issue-nfse-input';
import { validateIssueNfInput } from './nfemail-issue-input.validator';

describe('nfemail-issue-input.validator - Unit tests', () => {
  it('should be defined', () => {
    expect(validateIssueNfInput).toBeDefined();
  });

  it('should not throw when input is valid', () => {
    // Arrange
    const input = makeValidIssueNfInput();

    // Act & Assert
    expect(() => validateIssueNfInput(input)).not.toThrow();
  });

  it('should throw when emitter is missing', () => {
    // Arrange
    const input = makeValidIssueNfInput({ emitter: undefined });

    // Act & Assert
    expect(() => validateIssueNfInput(input)).toThrow(ExternalApiError);
    expect(() => validateIssueNfInput(input)).toThrow('Emitente é obrigatório');
  });

  it('should throw when recipient is missing', () => {
    // Arrange
    const input = makeValidIssueNfInput({ recipient: undefined });

    // Act & Assert
    expect(() => validateIssueNfInput(input)).toThrow(ExternalApiError);
    expect(() => validateIssueNfInput(input)).toThrow('Destinatário é obrigatório');
  });

  it('should throw when fiscal complement is missing', () => {
    // Arrange
    const input = makeValidIssueNfInput({ fiscal: undefined });

    // Act & Assert
    expect(() => validateIssueNfInput(input)).toThrow(ExternalApiError);
    expect(() => validateIssueNfInput(input)).toThrow('Dados fiscais complementares são obrigatórios');
  });

  it('should throw when items is empty', () => {
    // Arrange
    const input = makeValidIssueNfInput({ items: [] });

    // Act & Assert
    expect(() => validateIssueNfInput(input)).toThrow(ExternalApiError);
    expect(() => validateIssueNfInput(input)).toThrow('A nota fiscal deve conter ao menos um item');
  });

  it('should throw when item fiscal data is missing', () => {
    // Arrange
    const baseItem = makeValidIssueNfInput().items[0];
    const input = {
      ...makeValidIssueNfInput(),
      items: [{ ...baseItem, fiscal: undefined }],
    } as unknown as IssueNfInputDto;

    // Act & Assert
    expect(() => validateIssueNfInput(input)).toThrow(ExternalApiError);
    expect(() => validateIssueNfInput(input)).toThrow('Item 1: dados fiscais são obrigatórios');
  });

  it('should throw when item ibsCbs data is missing', () => {
    // Arrange
    const baseItem = makeValidIssueNfInput().items[0];
    const input = {
      ...makeValidIssueNfInput(),
      items: [{ ...baseItem, ibsCbs: undefined }],
    } as unknown as IssueNfInputDto;

    // Act & Assert
    expect(() => validateIssueNfInput(input)).toThrow(ExternalApiError);
    expect(() => validateIssueNfInput(input)).toThrow('Item 1: dados de IBS/CBS são obrigatórios');
  });

  it('should throw when item taxation data is missing', () => {
    // Arrange
    const baseItem = makeValidIssueNfInput().items[0];
    const input = {
      ...makeValidIssueNfInput(),
      items: [{ ...baseItem, taxation: undefined }],
    } as unknown as IssueNfInputDto;

    // Act & Assert
    expect(() => validateIssueNfInput(input)).toThrow(ExternalApiError);
    expect(() => validateIssueNfInput(input)).toThrow('Item 1: dados de tributação são obrigatórios');
  });

  it('should include item index in error message for invalid nested item', () => {
    // Arrange
    const baseItem = makeValidIssueNfInput().items[0];
    const input = {
      ...makeValidIssueNfInput(),
      items: [baseItem, { ...baseItem, fiscal: undefined }],
    } as unknown as IssueNfInputDto;

    // Act & Assert
    expect(() => validateIssueNfInput(input)).toThrow('Item 2: dados fiscais são obrigatórios');
  });

  it('should not throw when NFS-e input is valid', () => {
    // Arrange
    const input = makeValidIssueNfseInput();

    // Act & Assert
    expect(() => validateIssueNfInput(input)).not.toThrow();
  });

  it('should throw when NFS-e emitter municipal registration is missing', () => {
    // Arrange
    const input = makeValidIssueNfseInput({
      emitter: {
        ...makeValidIssueNfseInput().emitter,
        municipalRegistration: '',
      },
    });

    // Act & Assert
    expect(() => validateIssueNfInput(input)).toThrow('Emitente: inscrição municipal é obrigatória para NFS-e');
  });

  it('should throw when NFS-e service list item is missing', () => {
    // Arrange
    const baseItem = makeValidIssueNfseInput().items[0];
    const input = makeValidIssueNfseInput({
      items: [{
        ...baseItem,
        taxation: {
          ...baseItem.taxation,
          serviceListItem: '',
        },
      }],
    });

    // Act & Assert
    expect(() => validateIssueNfInput(input)).toThrow('Item 1: item da lista de serviço (LC 116) é obrigatório para NFS-e');
  });

  it('should not require item fiscal data for NFS-e', () => {
    // Arrange
    const baseItem = makeValidIssueNfseInput().items[0];
    const input = {
      ...makeValidIssueNfseInput(),
      items: [{ ...baseItem, fiscal: undefined, ibsCbs: undefined }],
    } as unknown as IssueNfInputDto;

    // Act & Assert
    expect(() => validateIssueNfInput(input)).not.toThrow();
  });

  it('should require item fiscal data for NF-e XML', () => {
    // Arrange
    const baseItem = makeValidIssueNfInput().items[0];
    const input = {
      ...makeValidIssueNfInput({ format: NfIssueFormat.NFE_XML }),
      items: [{ ...baseItem, fiscal: undefined }],
    } as unknown as IssueNfInputDto;

    // Act & Assert
    expect(() => validateIssueNfInput(input)).toThrow('Item 1: dados fiscais são obrigatórios');
  });
});
