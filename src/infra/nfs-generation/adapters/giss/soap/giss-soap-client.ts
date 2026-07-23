import { HttpService } from '@nestjs/axios';
import { Agent } from 'node:https';
import { XMLParser } from 'fast-xml-parser';
import { escapeXml } from '../mappers/xml-escape.util';
import { GISS_CABECALHO_NAMESPACE } from '../mappers/giss-namespaces';
import { GissCertMaterial } from '../signing/giss-pfx-loader';

const WRAPPER_NAMESPACE = 'http://nfse.abrasf.org.br';
const CABECALHO_VERSION = '2.04';

export enum GissOperation {
  RecepcionarLoteRps = 'RecepcionarLoteRps',
  ConsultarLoteRps = 'ConsultarLoteRps',
}

const responseParser = new XMLParser({ removeNSPrefix: true, ignoreAttributes: false });

/**
 * Namespace/estrutura confirmados no XSD oficial `cabecalho-v2_04.xsd`
 * (gissonline_docs/Schemas_XSD-Servicos_Prestados.rar): targetNamespace próprio do Giss (não o ABRASF
 * genérico do manual), elementFormDefault="qualified" (então `versaoDados` também carrega o prefixo) e
 * attributeFormDefault="unqualified" (o atributo `versao` fica sem prefixo).
 */
function buildCabecalho(): string {
  return `<p:cabecalho versao="${CABECALHO_VERSION}" xmlns:p="${GISS_CABECALHO_NAMESPACE}"><p:versaoDados>${CABECALHO_VERSION}</p:versaoDados></p:cabecalho>`;
}

/**
 * O Giss (assim como outras plataformas derivadas do Ginfes) não recebe o XML ABRASF puro direto no
 * `<soap:Body>`. Ele exige um wrapper genérico por operação (`<{Operacao}Request>`) com dois campos
 * string: `nfseCabecMsg` (o `<cabecalho>`) e `nfseDadosMsg` (o XML ABRASF de negócio, ex.: `EnviarLoteRpsEnvio`
 * já assinado) — ambos XML-escaped como texto, não como elementos filhos literais. Confirmado inspecionando
 * o WSDL real (`?wsdl=nfse.wsdl`) de ws-maua.giss.com.br, que não bate com o desenho ingênuo (`EnviarLoteRpsEnvio`
 * direto no Body) sugerido pelo manual "Guia Rápido".
 */
function buildEnvelope(operation: GissOperation, dadosMsgXml: string): string {
  const body = `<${operation}Request xmlns="${WRAPPER_NAMESPACE}">`
    + `<nfseCabecMsg xmlns="">${escapeXml(buildCabecalho())}</nfseCabecMsg>`
    + `<nfseDadosMsg xmlns="">${escapeXml(dadosMsgXml)}</nfseDadosMsg>`
    + `</${operation}Request>`;

  return `<?xml version="1.0" encoding="UTF-8"?>`
    + `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">`
    + `<soapenv:Body>${body}</soapenv:Body>`
    + `</soapenv:Envelope>`;
}

function unwrapOutputXml(operation: GissOperation, responseXml: string): string {
  const parsed = responseParser.parse(responseXml);
  const resposta = parsed?.Envelope?.Body?.[`${operation}Response`] ?? parsed?.[`${operation}Response`];
  const outputXml = resposta?.outputXML;

  if (typeof outputXml !== 'string' || !outputXml) {
    throw new Error(`Resposta inesperada do Giss: elemento ${operation}Response/outputXML não encontrado`);
  }

  return outputXml;
}

export async function postGissSoapRequest(
  httpService: HttpService,
  municipioSlug: string,
  operation: GissOperation,
  dadosMsgXml: string,
  certMaterial: GissCertMaterial,
): Promise<string> {
  const agent = new Agent({
    cert: certMaterial.certPem,
    key: certMaterial.keyPem,
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.2',
  });

  const endpoint = `https://ws-${municipioSlug}.giss.com.br/service-ws/nf/nfse-ws`;

  const result = await httpService.axiosRef.post<string>(endpoint, buildEnvelope(operation, dadosMsgXml), {
    httpsAgent: agent,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `${WRAPPER_NAMESPACE}/${operation}`,
    },
    responseType: 'text',
    transformResponse: (data) => data,
  });

  return unwrapOutputXml(operation, result.data);
}
