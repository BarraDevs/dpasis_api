import { NfsIssuedNoteDto } from '../../../dtos/nfs-batch-status.dto';

/**
 * Travessia do `CompNfse` do ABRASF 2.04, compartilhada por todas as respostas que devolvem notas:
 * consulta de lote, consulta por RPS e consulta por período. A estrutura é a mesma em todas —
 * `CompNfse/Nfse/InfNfse` para a identidade da nota e
 * `InfNfse/DeclaracaoPrestacaoServico/InfDeclaracaoPrestacaoServico/Rps/IdentificacaoRps` para a
 * chave natural do RPS, que é o que permite casar a nota do provedor com a nota local.
 */
export function toNfsIssuedNoteDto(comp: any): NfsIssuedNoteDto {
  const infNfse = comp?.Nfse?.InfNfse;
  const identificacaoRps = infNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Rps?.IdentificacaoRps;

  return {
    rpsNumber: Number(identificacaoRps?.Numero ?? 0),
    rpsSeries: String(identificacaoRps?.Serie ?? ''),
    nfseNumber: String(infNfse?.Numero ?? ''),
    verificationCode: String(infNfse?.CodigoVerificacao ?? ''),
    issueDate: String(infNfse?.DataEmissao ?? ''),
  };
}
