import { NfsProviderCredentialsDto } from './nfs-provider-credentials.dto';

export class FindNfsServicoPrestadoInputDto {
  provider: NfsProviderCredentialsDto;
  providerDocument: string;
  providerMunicipalRegistration?: string;
  page: number;
  /** ISO date YYYY-MM-DD — use with periodTo (XOR with nfseNumber) */
  periodFrom?: string;
  /** ISO date YYYY-MM-DD — use with periodFrom (XOR with nfseNumber) */
  periodTo?: string;
  /** Single NFS-e number (XOR with periodFrom/periodTo) */
  nfseNumber?: string;
  /** Optional taker CPF/CNPJ */
  takerDocument?: string;
}

export enum NfsNoteStatus {
  Normal = 'Normal',
  Cancelada = 'Cancelada',
}

export class NfsNoteDto {
  nfseNumber: string;
  verificationCode: string;
  issueDate: string;
  rpsNumber: number;
  rpsSeries: string;
  takerDocument: string | null;
  takerName: string | null;
  serviceAmount: string | null;
  status: NfsNoteStatus;
}

// retorno do giss ao buscar nfse por servico prestado
// {
//   "Nfse": {
//     "InfNfse": {
//       "Numero": 55267,
//       "CodigoVerificacao": "OUPFLTII4",
//       "DataEmissao": "2026-07-16T10:08:02.297-03:00",
//       "ValoresNfse": {
//         "BaseCalculo": 202.09,
//         "Aliquota": 3,
//         "ValorIss": 0,
//         "ValorLiquidoNfse": 202.09
//       },
//       "DescricaoCodigoTributacaoMunicipio": "Revisao,Manut.,Cons.E Rest.De Equips. Informatica",
//       "PrestadorServico": {
//         "RazaoSocial": "DPA TEC EQUIPAMENTOS DE PONTO LTDA",
//         "Endereco": {
//           "Endereco": "Distrito Vice-Presidente Francisco Silviano Alves Brandão",
//           "Numero": 615,
//           "Complemento": "CASA 01",
//           "Bairro": "Parque São Vicente",
//           "CodigoMunicipio": 3529401,
//           "Uf": "SP",
//           "Cep": 9371160
//         },
//         "Contato": {
//           "Telefone": 1145143522,
//           "Email": "nfe@dpatec.com.br"
//         }
//       },
//       "OrgaoGerador": {
//         "CodigoMunicipio": 3529401,
//         "Uf": "SP"
//       },
//       "DeclaracaoPrestacaoServico": {
//         "InfDeclaracaoPrestacaoServico": {
//           "Rps": {
//             "IdentificacaoRps": {
//               "Numero": 73046,
//               "Serie": 1,
//               "Tipo": 1
//             },
//             "DataEmissao": "2026-07-15-03:00",
//             "Status": 1
//           },
//           "Competencia": "2026-07-15-03:00",
//           "Servico": {
//             "Valores": {
//               "ValorServicos": 202.09,
//               "ValorDeducoes": 0,
//               "ValorInss": 0,
//               "ValorIr": 0,
//               "ValorCsll": 0,
//               "OutrasRetencoes": 0,
//               "ValorIss": 0,
//               "Aliquota": 3,
//               "DescontoIncondicionado": 0,
//               "DescontoCondicionado": 0,
//               "trib": {
//                 "tribFed": {
//                   "piscofins": {
//                     "CST": 0,
//                     "vBCPisCofins": 202.09,
//                     "pAliqPis": 0,
//                     "pAliqCofins": 0,
//                     "vPis": 0,
//                     "vCofins": 0,
//                     "tpRetPisCofins": 0
//                   }
//                 }
//               },
//               "IBSCBS": {
//                 "finNFSe": 1,
//                 "indFinal": 0,
//                 "cIndOp": 50101,
//                 "indDest": 0,
//                 "valores": {
//                   "trib": {
//                     "gIBSCBS": {
//                       "CST": 0,
//                       "cClassTrib": 1
//                     }
//                   },
//                   "pRedutor": 0,
//                   "vBC": 202.09
//                 }
//               }
//             },
//             "IssRetido": 2,
//             "ItemListaServico": 1.07,
//             "CodigoTributacaoMunicipio": 2250,
//             "CodigoNbs": "1.1501.30.00",
//             "Discriminacao": "01039 - SUP.TEC.MAN.OUTROS SERV TI WEB-100 (202203) - 1 - 202.09\n\nPar. Vencimento\n1-1 15/08/26\n\n6209-1/00 - SUPORTE TECNICO, MANUTENCAO E OUTROS SERVICOS EM TECNOLOGIA DA INFORMACAO\nCONTRATO DE PRESTACAO DE SERVICO N. SISWEB SAAS 202103170135-WEB50 REV1\nCONTROLE DE PONTO ELETRONICO \nCONTROLE SW DE GERENCIAMENTO \nRESP. UTILIZACAO SETOR RH/DP",
//             "CodigoMunicipio": 3529401,
//             "CodigoPais": 76,
//             "ExigibilidadeISS": 1,
//             "MunicipioIncidencia": 3529401
//           },
//           "Prestador": {
//             "CpfCnpj": {
//               "Cnpj": 2099923000178
//             },
//             "InscricaoMunicipal": 16895
//           },
//           "TomadorServico": {
//             "IdentificacaoTomador": {
//               "CpfCnpj": {
//                 "Cnpj": 35083999000164
//               }
//             },
//             "RazaoSocial": "ALL IS LOVE IND E COM DE ROUPAS E ACES LTDA",
//             "Endereco": {
//               "Endereco": "RUA DA GRACA, 856",
//               "Numero": 856,
//               "Bairro": "BOM RETIRO",
//               "CodigoMunicipio": 3550308,
//               "Uf": "SP",
//               "Cep": 5016081
//             },
//             "Contato": {
//               "Telefone": 1133370230,
//               "Email": "faturamento@alls.com.br"
//             }
//           },
//           "OptanteSimplesNacional": 1,
//           "IncentivoFiscal": 2,
//           "@_Id": "79531"
//         }
//       },
//       "@_Id": "79531"
//     },
//     "@_versao": "2.00"
//   }
// }
