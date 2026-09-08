import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { CircuitBreaker } from 'src/shared/circuit-breaker/circuit-breaker';
import { GissCertMaterial } from '../signing/giss-pfx-loader';
import { GissOperation, GissSoapClient } from './giss-soap-client';

const certMaterial: GissCertMaterial = {
  certPem: '-----BEGIN CERTIFICATE-----\ncert\n-----END CERTIFICATE-----',
  keyPem: '-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----',
};

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function makeSoapResponse(operation: GissOperation, outputXml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${operation}Response xmlns="http://nfse.abrasf.org.br">
      <outputXML>${escapeXmlText(outputXml)}</outputXML>
    </${operation}Response>
  </soap:Body>
</soap:Envelope>`;
}

describe('GissSoapClient.postSoapRequest - Unit tests', () => {
  let httpService: HttpService;

  beforeEach(() => {
    // O disjuntor guarda estado por município entre chamadas; sem reset, um caso de erro deixaria o
    // circuito aberto para o seguinte.
    CircuitBreaker.reset();
    httpService = createMock<HttpService>();
    Object.assign(httpService, { axiosRef: { post: jest.fn() } });
  });

  it('should be defined', () => {
    expect(GissSoapClient).toBeDefined();
  });

  it('should post RecepcionarLoteRps with escaped cabecalho and dados in the SOAP envelope', async() => {
    // Arrange
    const dadosXml = '<p:EnviarLoteRpsEnvio xmlns:p="http://www.giss.com.br/enviar-lote-rps-envio-v2_04.xsd"><p:LoteRps Id="lote1"/></p:EnviarLoteRpsEnvio>';
    const outputXml = '<EnviarLoteRpsResposta><Protocolo>PROTO-1</Protocolo></EnviarLoteRpsResposta>';
    (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
      data: makeSoapResponse(GissOperation.RecepcionarLoteRps, outputXml),
    });

    // Act
    const result = await GissSoapClient.postSoapRequest(
      httpService,
      'maua',
      GissOperation.RecepcionarLoteRps,
      dadosXml,
      certMaterial,
    );

    // Assert
    expect(result.outputXml).toBe(outputXml);
    const [endpoint, body, config] = (httpService.axiosRef.post as jest.Mock).mock.calls[0];
    expect(endpoint).toBe('https://ws-maua.giss.com.br/service-ws/nf/nfse-ws');
    expect(config.httpsAgent).toBeDefined();
    expect(config.headers['Content-Type']).toBe('text/xml; charset=utf-8');
    expect(config.headers.SOAPAction).toBe('http://nfse.abrasf.org.br/RecepcionarLoteRps');
    expect(config.responseType).toBe('text');
    expect(body).toContain('<RecepcionarLoteRpsRequest xmlns="http://nfse.abrasf.org.br">');
    expect(body).toContain('<nfseCabecMsg xmlns="">');
    expect(body).toContain('<nfseDadosMsg xmlns="">');
    expect(body).toContain('&lt;p:cabecalho versao=&quot;2.04&quot; xmlns:p=&quot;http://www.giss.com.br/cabecalho-v2_04.xsd&quot;&gt;');
    expect(body).toContain('&lt;p:versaoDados&gt;2.04&lt;/p:versaoDados&gt;');
    expect(body).toContain('&lt;p:EnviarLoteRpsEnvio');
    expect(body).not.toContain(dadosXml);
  });

  it('should post ConsultarLoteRps with the correct SOAPAction', async() => {
    // Arrange
    const dadosXml = '<p:ConsultarLoteRpsEnvio xmlns:p="http://www.giss.com.br/consultar-lote-rps-envio-v2_04.xsd"><p:Protocolo>PROTO-1</p:Protocolo></p:ConsultarLoteRpsEnvio>';
    const outputXml = '<ConsultarLoteRpsResposta><Situacao>2</Situacao></ConsultarLoteRpsResposta>';
    (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
      data: makeSoapResponse(GissOperation.ConsultarLoteRps, outputXml),
    });

    // Act
    const result = await GissSoapClient.postSoapRequest(
      httpService,
      'demonstracao',
      GissOperation.ConsultarLoteRps,
      dadosXml,
      certMaterial,
    );

    // Assert
    expect(result.outputXml).toBe(outputXml);
    const [, body, config] = (httpService.axiosRef.post as jest.Mock).mock.calls[0];
    expect(config.headers.SOAPAction).toBe('http://nfse.abrasf.org.br/ConsultarLoteRps');
    expect(body).toContain('<ConsultarLoteRpsRequest xmlns="http://nfse.abrasf.org.br">');
    expect(body).toContain('&lt;p:ConsultarLoteRpsEnvio');
  });

  it('should post ConsultarNfsePorRps with the correct SOAPAction', async() => {
    // Arrange
    const dadosXml = '<p:ConsultarNfseRpsEnvio xmlns:p="http://www.giss.com.br/consultar-nfse-rps-envio-v2_04.xsd"/>';
    const outputXml = '<ConsultarNfseRpsResposta><CompNfse/></ConsultarNfseRpsResposta>';
    (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
      data: makeSoapResponse(GissOperation.ConsultarNfsePorRps, outputXml),
    });

    // Act
    const result = await GissSoapClient.postSoapRequest(
      httpService,
      'maua',
      GissOperation.ConsultarNfsePorRps,
      dadosXml,
      certMaterial,
    );

    // Assert
    expect(result.outputXml).toBe(outputXml);
    const [, body, config] = (httpService.axiosRef.post as jest.Mock).mock.calls[0];
    expect(config.headers.SOAPAction).toBe('http://nfse.abrasf.org.br/ConsultarNfsePorRps');
    expect(body).toContain('<ConsultarNfsePorRpsRequest xmlns="http://nfse.abrasf.org.br">');
    expect(body).toContain('&lt;p:ConsultarNfseRpsEnvio');
  });

  it('should post ConsultarNfseServicoPrestado with the correct SOAPAction', async() => {
    // Arrange
    const dadosXml = '<p:ConsultarNfseServicoPrestadoEnvio xmlns:p="http://www.giss.com.br/consultar-nfse-servico-prestado-envio-v2_04.xsd"/>';
    const outputXml = '<ConsultarNfseServicoPrestadoResposta><ListaNfse/></ConsultarNfseServicoPrestadoResposta>';
    (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
      data: makeSoapResponse(GissOperation.ConsultarNfseServicoPrestado, outputXml),
    });

    // Act
    const result = await GissSoapClient.postSoapRequest(
      httpService,
      'maua',
      GissOperation.ConsultarNfseServicoPrestado,
      dadosXml,
      certMaterial,
    );

    // Assert
    expect(result.outputXml).toBe(outputXml);
    const [, body, config] = (httpService.axiosRef.post as jest.Mock).mock.calls[0];
    expect(config.headers.SOAPAction).toBe('http://nfse.abrasf.org.br/ConsultarNfseServicoPrestado');
    expect(body).toContain('<ConsultarNfseServicoPrestadoRequest xmlns="http://nfse.abrasf.org.br">');
  });

  it('should unwrap outputXML from a response without SOAP envelope', async() => {
    // Arrange
    const outputXml = '<EnviarLoteRpsResposta><Protocolo>PROTO-DIRECT</Protocolo></EnviarLoteRpsResposta>';
    const directResponse = `<RecepcionarLoteRpsResponse xmlns="http://nfse.abrasf.org.br"><outputXML>${escapeXmlText(outputXml)}</outputXML></RecepcionarLoteRpsResponse>`;
    (httpService.axiosRef.post as jest.Mock).mockResolvedValue({ data: directResponse });

    // Act
    const result = await GissSoapClient.postSoapRequest(
      httpService,
      'maua',
      GissOperation.RecepcionarLoteRps,
      '<xml/>',
      certMaterial,
    );

    // Assert
    expect(result.outputXml).toBe(outputXml);
  });

  it('should throw when outputXML is missing from the SOAP response', async() => {
    // Arrange
    const responseWithoutOutput = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><RecepcionarLoteRpsResponse xmlns="http://nfse.abrasf.org.br"></RecepcionarLoteRpsResponse></soap:Body></soap:Envelope>';
    (httpService.axiosRef.post as jest.Mock).mockResolvedValue({ data: responseWithoutOutput });

    // Act & Assert
    await expect(
      GissSoapClient.postSoapRequest(httpService, 'maua', GissOperation.RecepcionarLoteRps, '<xml/>', certMaterial),
    ).rejects.toThrow('RecepcionarLoteRpsResponse/outputXML não encontrado');
  });

  it('should throw when the SOAP response element is missing', async() => {
    // Arrange
    (httpService.axiosRef.post as jest.Mock).mockResolvedValue({ data: '<foo></foo>' });

    // Act & Assert
    await expect(
      GissSoapClient.postSoapRequest(httpService, 'maua', GissOperation.ConsultarLoteRps, '<xml/>', certMaterial),
    ).rejects.toThrow('ConsultarLoteRpsResponse/outputXML não encontrado');
  });

  it('should return requestBody, httpStatus and durationMs on success', async() => {
    // Arrange
    const outputXml = '<EnviarLoteRpsResposta><Protocolo>PROTO-TRACE</Protocolo></EnviarLoteRpsResposta>';
    (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
      data: makeSoapResponse(GissOperation.RecepcionarLoteRps, outputXml),
      status: 200,
    });

    // Act
    const result = await GissSoapClient.postSoapRequest(
      httpService,
      'maua',
      GissOperation.RecepcionarLoteRps,
      '<xml/>',
      certMaterial,
    );

    // Assert
    expect(result.outputXml).toBe(outputXml);
    expect(result.requestBody).toContain('<RecepcionarLoteRpsRequest');
    expect(result.httpStatus).toBe(200);
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should post CancelarNfse with the correct SOAPAction', async() => {
    // Arrange
    const dadosXml = '<p:CancelarNfseEnvio xmlns:p="http://www.giss.com.br/cancelar-nfse-envio-v2_04.xsd"/>';
    const outputXml = '<CancelarNfseResposta><DataHora>2026-01-01</DataHora></CancelarNfseResposta>';
    (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
      data: makeSoapResponse(GissOperation.CancelarNfse, outputXml),
      status: 200,
    });

    // Act
    const result = await GissSoapClient.postSoapRequest(
      httpService,
      'maua',
      GissOperation.CancelarNfse,
      dadosXml,
      certMaterial,
    );

    // Assert
    expect(result.outputXml).toBe(outputXml);
    const [, body, config] = (httpService.axiosRef.post as jest.Mock).mock.calls[0];
    expect(config.headers.SOAPAction).toBe('http://nfse.abrasf.org.br/CancelarNfse');
    expect(body).toContain('<CancelarNfseRequest xmlns="http://nfse.abrasf.org.br">');
  });

  it('should wrap HTTP rejections as GissSoapCallError with trace fields', async() => {
    // Arrange
    const httpError = Object.assign(new Error('Request failed with status code 503'), {
      response: { status: 503, data: '<fault>indisponivel</fault>' },
    });
    (httpService.axiosRef.post as jest.Mock).mockRejectedValue(httpError);

    // Act & Assert
    await expect(
      GissSoapClient.postSoapRequest(httpService, 'maua', GissOperation.RecepcionarLoteRps, '<xml/>', certMaterial),
    ).rejects.toMatchObject({
      name: 'GissSoapCallError',
      message: 'Request failed with status code 503',
      cause: httpError,
      trace: expect.objectContaining({
        requestBody: expect.stringContaining('<RecepcionarLoteRpsRequest'),
        responseBody: '<fault>indisponivel</fault>',
        httpStatus: 503,
      }),
    });
  });
});
