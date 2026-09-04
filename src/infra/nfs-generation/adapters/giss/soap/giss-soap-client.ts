import { HttpService } from '@nestjs/axios';
import { Agent } from 'node:https';
import { XMLParser } from 'fast-xml-parser';
import { XmlEscapeUtil } from '../mappers/xml-escape.util';
import { GISS_CABECALHO_NAMESPACE } from '../constants/giss-namespaces';
import { GissCertMaterial } from '../signing/giss-pfx-loader';
import {
  extractHttpStatus,
  extractResponseBody,
  GissSoapCallError,
  type GissSoapCallResult,
} from './giss-soap-call.error';

export enum GissOperation {
  RecepcionarLoteRps = 'RecepcionarLoteRps',
  ConsultarLoteRps = 'ConsultarLoteRps',
  CancelarNfse = 'CancelarNfse',
}

export class GissSoapClient {
  private static readonly WRAPPER_NAMESPACE = 'http://nfse.abrasf.org.br';
  private static readonly CABECALHO_VERSION = '2.04';
  private static readonly RESPONSE_PARSER = new XMLParser({ removeNSPrefix: true, ignoreAttributes: false });

  /**
   * Namespace/estrutura confirmados no XSD oficial `cabecalho-v2_04.xsd`
   * (gissonline_docs/Schemas_XSD-Servicos_Prestados.rar): targetNamespace próprio do Giss (não o ABRASF
   * genérico do manual), elementFormDefault="qualified" (então `versaoDados` também carrega o prefixo) e
   * attributeFormDefault="unqualified" (o atributo `versao` fica sem prefixo).
   */
  private static buildCabecalho(): string {
    return `<p:cabecalho versao="${this.CABECALHO_VERSION}" xmlns:p="${GISS_CABECALHO_NAMESPACE}"><p:versaoDados>${this.CABECALHO_VERSION}</p:versaoDados></p:cabecalho>`;
  }

  /**
   * O Giss (assim como outras plataformas derivadas do Ginfes) não recebe o XML ABRASF puro direto no
   * `<soap:Body>`. Ele exige um wrapper genérico por operação (`<{Operacao}Request>`) com dois campos
   * string: `nfseCabecMsg` (o `<cabecalho>`) e `nfseDadosMsg` (o XML ABRASF de negócio, ex.: `EnviarLoteRpsEnvio`
   * já assinado) — ambos XML-escaped como texto, não como elementos filhos literais. Confirmado inspecionando
   * o WSDL real (`?wsdl=nfse.wsdl`) de ws-maua.giss.com.br, que não bate com o desenho ingênuo (`EnviarLoteRpsEnvio`
   * direto no Body) sugerido pelo manual "Guia Rápido".
   */
  private static buildEnvelope(operation: GissOperation, dadosMsgXml: string): string {
    const body = `<${operation}Request xmlns="${this.WRAPPER_NAMESPACE}">`
      + `<nfseCabecMsg xmlns="">${XmlEscapeUtil.escape(this.buildCabecalho())}</nfseCabecMsg>`
      + `<nfseDadosMsg xmlns="">${XmlEscapeUtil.escape(dadosMsgXml)}</nfseDadosMsg>`
      + `</${operation}Request>`;

    return '<?xml version="1.0" encoding="UTF-8"?>'
      + '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">'
      + `<soapenv:Body>${body}</soapenv:Body>`
      + '</soapenv:Envelope>';
  }

  private static unwrapOutputXml(operation: GissOperation, responseXml: string): string {
    const parsed = this.RESPONSE_PARSER.parse(responseXml);
    const resposta = parsed?.Envelope?.Body?.[`${operation}Response`] ?? parsed?.[`${operation}Response`];
    const outputXml = resposta?.outputXML;

    if (typeof outputXml !== 'string' || !outputXml) {
      throw new Error(`Resposta inesperada do Giss: elemento ${operation}Response/outputXML não encontrado`);
    }

    return outputXml;
  }

  static async postSoapRequest(
    httpService: HttpService,
    municipioSlug: string,
    operation: GissOperation,
    dadosMsgXml: string,
    certMaterial: GissCertMaterial,
  ): Promise<GissSoapCallResult> {
    const agent = new Agent({
      cert: certMaterial.certPem,
      key: certMaterial.keyPem,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.2',
    });

    const endpoint = `https://ws-${municipioSlug}.giss.com.br/service-ws/nf/nfse-ws`;
    const envelope = this.buildEnvelope(operation, dadosMsgXml);
    const startedAt = Date.now();

    try {
      const result = await httpService.axiosRef.post<string>(endpoint, envelope, {
        httpsAgent: agent,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: `${this.WRAPPER_NAMESPACE}/${operation}`,
        },
        responseType: 'text',
        transformResponse: (data) => data,
      });

      return {
        outputXml: this.unwrapOutputXml(operation, result.data),
        requestBody: envelope,
        responseBody: typeof result.data === 'string' ? result.data : String(result.data),
        httpStatus: result.status,
        durationMs: Date.now() - startedAt,
      };
    }
    catch (error: unknown) {
      // O corpo enviado e o recebido só existem aqui. Anexá-los ao erro é o que permite o gateway
      // gravar a tentativa também quando ela falha — que é justamente quando o rastro importa.
      throw new GissSoapCallError(error, {
        requestBody: envelope,
        responseBody: extractResponseBody(error),
        httpStatus: extractHttpStatus(error),
        durationMs: Date.now() - startedAt,
      });
    }
  }
}
