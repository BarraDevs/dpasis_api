import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { IssueNfseInputDto } from 'src/app/tax-invoice/nfse/application/usecases/issue-nfse/dtos/issue-nfse.dto';
import { AppException } from 'src/core/filters/app.exception';
import { NfmDto } from '../dtos/nfm.dto';

export class NfmToIssueNfseMapper {
  public static toIssueNfseInput(nfm: NfmDto, providerConfig: CompanyNfsConfigDto): IssueNfseInputDto {
    const firstItem = nfm.clientItems[0];
    if (!firstItem) {
      throw new AppException('Grupo NFM sem itens de serviço.');
    }

    const cnaeNbsIndop = firstItem.cnaeNbsIndop;
    const serviceListItemCode = cnaeNbsIndop.serviceListItemCode?.trim();
    if (!serviceListItemCode) {
      throw new AppException(
        `Correspondência CNAE/NBS/INDOP ${cnaeNbsIndop.id} sem ItemListaServico (LC 116).`,
      );
    }

    if (providerConfig.issRate == null) {
      throw new AppException(
        `Config NFS-e da empresa ${providerConfig.companyId} sem alíquota de ISS.`,
      );
    }

    const municipalTaxCode = providerConfig.municipalTaxCode?.trim();
    if (!municipalTaxCode) {
      throw new AppException(
        `Config NFS-e da empresa ${providerConfig.companyId} sem código de tributação municipal.`,
      );
    }

    const description = nfm.clientItems.map(item => item.description).join('\n');
    const servicesValue = nfm.clientItems.reduce((sum, item) => sum + item.totalValueInCents, 0) / 100;
    const issWithheld = nfm.clientInvoiceConfig.issWithheld;

    return {
      companyId: nfm.client.company.id,
      clientId: nfm.client.id,
      simpleNationalOptant: providerConfig.simpleNationalOptant,
      fiscalIncentive: providerConfig.fiscalIncentive,
      service: {
        serviceListItemCode,
        nbsCode: cnaeNbsIndop.nbs.code,
        indopCode: cnaeNbsIndop.indop.code,
        cClassTrib: '000001',
        ibsCbsCst: '000',
        description,
        serviceMunicipalCodeIbge: providerConfig.municipalCodeIbge,
        issExigibility: providerConfig.issExigibility,
        issWithheld,
        servicesValue,
        cnaeCode: cnaeNbsIndop.cnae.code.replace(/\D/g, ''),
        issRate: providerConfig.issRate,
        municipalTaxCode,
        ...(issWithheld ? { issRetentionResponsible: 1 as const } : {}),
      },
    };
  }
}
