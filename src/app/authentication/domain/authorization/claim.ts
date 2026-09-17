/**
 * Domínio de permissões e integração com CASL.
 *
 * **O que é CASL (neste projeto)**
 * A biblioteca `@casl/ability` modela o que o usuário **pode fazer** como regras `can(ação, assunto)`.
 * Cada permissão administrativa é um par `{ subject, action }` alinhado a `AccountClaim` no banco
 * e às regras CASL em {@link CaslAbilityFactory}, verificadas nos guards com `ability.can(ação, assunto)`.
 *
 * **Fluxo de dados**
 * - **Admin:** claims vêm do banco (`AccountClaim`); lista vazia ⇒ nenhuma permissão via CASL nas rotas
 *   protegidas por claim (comportamento “fail closed”).
 * - **Demais papéis:** {@link STATIC_CLAIMS} (fixo no código).
 *
 * **Constantes `Claim` (v1)**
 * Por assunto existem só `*_READ` e `*_WRITE`, alinhados a {@link ClaimAction.Read} / {@link ClaimAction.Write}
 * no banco (`AccountClaim`) e nas rotas (`@RequiredClaims`).
 */
import { ClaimAction } from './claim-action.enum';
import { ClaimSubject } from './claim-subject.enum';

// export const Claim = {
//   BANK_CREATE: { subject: ClaimSubject.Bank, action: ClaimAction.Create },
//   BANK_LIST: { subject: ClaimSubject.Bank, action: ClaimAction.List },
//   BANK_DETAIL: { subject: ClaimSubject.Bank, action: ClaimAction.Detail },
//   BANK_UPDATE: { subject: ClaimSubject.Bank, action: ClaimAction.Update },
//   BANK_UPDATE_STATUS: { subject: ClaimSubject.Bank, action: ClaimAction.UpdateStatus },
//
//   OTHER_CLAIMS...
// } as const;

export const Claim = {
  ADMIN_READ: { subject: ClaimSubject.Admin, action: ClaimAction.Read },
  ADMIN_WRITE: { subject: ClaimSubject.Admin, action: ClaimAction.Write },

  AUDIT_READ: { subject: ClaimSubject.Audit, action: ClaimAction.Read },
  AUDIT_WRITE: { subject: ClaimSubject.Audit, action: ClaimAction.Write },

  BANK_READ: { subject: ClaimSubject.Bank, action: ClaimAction.Read },
  BANK_WRITE: { subject: ClaimSubject.Bank, action: ClaimAction.Write },

  BANK_PAYMENT_READ: { subject: ClaimSubject.BankPayment, action: ClaimAction.Read },
  BANK_PAYMENT_WRITE: { subject: ClaimSubject.BankPayment, action: ClaimAction.Write },

  BILLED_READ: { subject: ClaimSubject.Billed, action: ClaimAction.Read },
  BILLED_WRITE: { subject: ClaimSubject.Billed, action: ClaimAction.Write },

  CASH_FLOW_ENTRY_READ: { subject: ClaimSubject.CashFlowEntry, action: ClaimAction.Read },
  CASH_FLOW_ENTRY_WRITE: { subject: ClaimSubject.CashFlowEntry, action: ClaimAction.Write },

  CATEGORY_READ: { subject: ClaimSubject.Category, action: ClaimAction.Read },
  CATEGORY_WRITE: { subject: ClaimSubject.Category, action: ClaimAction.Write },

  DEPARTMENT_READ: { subject: ClaimSubject.Department, action: ClaimAction.Read },
  DEPARTMENT_WRITE: { subject: ClaimSubject.Department, action: ClaimAction.Write },

  DELIVERY_TERM_READ: { subject: ClaimSubject.DeliveryTerm, action: ClaimAction.Read },
  DELIVERY_TERM_WRITE: { subject: ClaimSubject.DeliveryTerm, action: ClaimAction.Write },

  FREIGHT_READ: { subject: ClaimSubject.Freight, action: ClaimAction.Read },
  FREIGHT_WRITE: { subject: ClaimSubject.Freight, action: ClaimAction.Write },

  PROPOSAL_VALIDITY_READ: { subject: ClaimSubject.ProposalValidity, action: ClaimAction.Read },
  PROPOSAL_VALIDITY_WRITE: { subject: ClaimSubject.ProposalValidity, action: ClaimAction.Write },

  WARRANTY_READ: { subject: ClaimSubject.Warranty, action: ClaimAction.Read },
  WARRANTY_WRITE: { subject: ClaimSubject.Warranty, action: ClaimAction.Write },

  CNAE_READ: { subject: ClaimSubject.Cnae, action: ClaimAction.Read },
  CNAE_WRITE: { subject: ClaimSubject.Cnae, action: ClaimAction.Write },

  CNAE_NBS_INDOP_READ: { subject: ClaimSubject.CnaeNbsIndop, action: ClaimAction.Read },
  CNAE_NBS_INDOP_WRITE: { subject: ClaimSubject.CnaeNbsIndop, action: ClaimAction.Write },

  INDOP_READ: { subject: ClaimSubject.Indop, action: ClaimAction.Read },
  INDOP_WRITE: { subject: ClaimSubject.Indop, action: ClaimAction.Write },

  NBS_READ: { subject: ClaimSubject.Nbs, action: ClaimAction.Read },
  NBS_WRITE: { subject: ClaimSubject.Nbs, action: ClaimAction.Write },

  NFM_READ: { subject: ClaimSubject.Nfm, action: ClaimAction.Read },
  NFM_WRITE: { subject: ClaimSubject.Nfm, action: ClaimAction.Write },

  CARRIER_READ: { subject: ClaimSubject.Carrier, action: ClaimAction.Read },
  CARRIER_WRITE: { subject: ClaimSubject.Carrier, action: ClaimAction.Write },

  COMPANY_READ: { subject: ClaimSubject.Company, action: ClaimAction.Read },
  COMPANY_WRITE: { subject: ClaimSubject.Company, action: ClaimAction.Write },

  COMPANY_NFS_CONFIG_READ: { subject: ClaimSubject.CompanyNfsConfig, action: ClaimAction.Read },
  COMPANY_NFS_CONFIG_WRITE: { subject: ClaimSubject.CompanyNfsConfig, action: ClaimAction.Write },

  PROVIDER_READ: { subject: ClaimSubject.Provider, action: ClaimAction.Read },
  PROVIDER_WRITE: { subject: ClaimSubject.Provider, action: ClaimAction.Write },

  PROVIDER_ITEM_READ: { subject: ClaimSubject.ProviderItem, action: ClaimAction.Read },
  PROVIDER_ITEM_WRITE: { subject: ClaimSubject.ProviderItem, action: ClaimAction.Write },

  CLIENT_READ: { subject: ClaimSubject.Client, action: ClaimAction.Read },
  CLIENT_WRITE: { subject: ClaimSubject.Client, action: ClaimAction.Write },

  RESALE_READ: { subject: ClaimSubject.Resale, action: ClaimAction.Read },
  RESALE_WRITE: { subject: ClaimSubject.Resale, action: ClaimAction.Write },

  RESALE_CONTACT_READ: { subject: ClaimSubject.ResaleContact, action: ClaimAction.Read },
  RESALE_CONTACT_WRITE: { subject: ClaimSubject.ResaleContact, action: ClaimAction.Write },

  SELLER_READ: { subject: ClaimSubject.Seller, action: ClaimAction.Read },
  SELLER_WRITE: { subject: ClaimSubject.Seller, action: ClaimAction.Write },

  CLIENT_ADDRESS_READ: { subject: ClaimSubject.ClientAddress, action: ClaimAction.Read },
  CLIENT_ADDRESS_WRITE: { subject: ClaimSubject.ClientAddress, action: ClaimAction.Write },

  CLIENT_ATTACHMENT_READ: { subject: ClaimSubject.ClientAttachment, action: ClaimAction.Read },
  CLIENT_ATTACHMENT_WRITE: { subject: ClaimSubject.ClientAttachment, action: ClaimAction.Write },

  CLIENT_ATTENDANCE_READ: { subject: ClaimSubject.ClientAttendance, action: ClaimAction.Read },
  CLIENT_ATTENDANCE_WRITE: { subject: ClaimSubject.ClientAttendance, action: ClaimAction.Write },

  CLIENT_CONTACT_READ: { subject: ClaimSubject.ClientContact, action: ClaimAction.Read },
  CLIENT_CONTACT_WRITE: { subject: ClaimSubject.ClientContact, action: ClaimAction.Write },

  CLIENT_DESCRIPTION_TYPE_READ: { subject: ClaimSubject.ClientDescriptionType, action: ClaimAction.Read },
  CLIENT_DESCRIPTION_TYPE_WRITE: { subject: ClaimSubject.ClientDescriptionType, action: ClaimAction.Write },

  CLIENT_DISCOUNT_READ: { subject: ClaimSubject.ClientDiscount, action: ClaimAction.Read },
  CLIENT_DISCOUNT_WRITE: { subject: ClaimSubject.ClientDiscount, action: ClaimAction.Write },

  CLIENT_DRIVE_TYPE_READ: { subject: ClaimSubject.ClientDriveType, action: ClaimAction.Read },
  CLIENT_DRIVE_TYPE_WRITE: { subject: ClaimSubject.ClientDriveType, action: ClaimAction.Write },

  CLIENT_GROUP_READ: { subject: ClaimSubject.ClientGroup, action: ClaimAction.Read },
  CLIENT_GROUP_WRITE: { subject: ClaimSubject.ClientGroup, action: ClaimAction.Write },

  CLIENT_INVOICE_CONFIG_READ: { subject: ClaimSubject.ClientInvoiceConfig, action: ClaimAction.Read },
  CLIENT_INVOICE_CONFIG_WRITE: { subject: ClaimSubject.ClientInvoiceConfig, action: ClaimAction.Write },

  CLIENT_ITEM_READ: { subject: ClaimSubject.ClientItem, action: ClaimAction.Read },
  CLIENT_ITEM_WRITE: { subject: ClaimSubject.ClientItem, action: ClaimAction.Write },

  CLIENT_MAINTENANCE_TICKET_READ: { subject: ClaimSubject.ClientMaintenanceTicket, action: ClaimAction.Read },
  CLIENT_MAINTENANCE_TICKET_WRITE: { subject: ClaimSubject.ClientMaintenanceTicket, action: ClaimAction.Write },

  CLIENT_OWNER_READ: { subject: ClaimSubject.ClientOwner, action: ClaimAction.Read },
  CLIENT_OWNER_WRITE: { subject: ClaimSubject.ClientOwner, action: ClaimAction.Write },

  CLIENT_SYSTEM_TYPE_READ: { subject: ClaimSubject.ClientSystemType, action: ClaimAction.Read },
  CLIENT_SYSTEM_TYPE_WRITE: { subject: ClaimSubject.ClientSystemType, action: ClaimAction.Write },

  CLIENT_TYPE_READ: { subject: ClaimSubject.ClientType, action: ClaimAction.Read },
  CLIENT_TYPE_WRITE: { subject: ClaimSubject.ClientType, action: ClaimAction.Write },

  FAQ_READ: { subject: ClaimSubject.Faq, action: ClaimAction.Read },
  FAQ_WRITE: { subject: ClaimSubject.Faq, action: ClaimAction.Write },

  HONORIFIC_READ: { subject: ClaimSubject.Honorific, action: ClaimAction.Read },
  HONORIFIC_WRITE: { subject: ClaimSubject.Honorific, action: ClaimAction.Write },

  SERVICE_ATTENDANCE_VALUE_READ: { subject: ClaimSubject.ServiceAttendanceValue, action: ClaimAction.Read },
  SERVICE_ATTENDANCE_VALUE_WRITE: { subject: ClaimSubject.ServiceAttendanceValue, action: ClaimAction.Write },

  SERVICE_CATALOG_READ: { subject: ClaimSubject.ServiceCatalog, action: ClaimAction.Read },
  SERVICE_CATALOG_WRITE: { subject: ClaimSubject.ServiceCatalog, action: ClaimAction.Write },

  VOUCHER_READ: { subject: ClaimSubject.Voucher, action: ClaimAction.Read },
  VOUCHER_WRITE: { subject: ClaimSubject.Voucher, action: ClaimAction.Write },
} as const;

// Define o tipo ClaimValue como qualquer um dos valores presentes no objeto Claim.
// Isso faz com que ClaimValue seja uma união dos tipos dos valores (objetos { subject, action }) de cada campo em Claim.
export type ClaimValue = (typeof Claim)[keyof typeof Claim];

// Define uma constante readonly ClaimValue[] contendo todos os valores presentes no objeto Claim.
export const ALL_CLAIM_VALUES: readonly ClaimValue[] = Object.values(Claim);

// Define um mapa (chave: string, valor: ClaimValue) contendo todos os valores presentes no objeto Claim.
const CLAIM_BY_SUBJECT_ACTION = new Map<string, ClaimValue>(
  ALL_CLAIM_VALUES.map(c => [generateMapKey(c.subject, c.action), c]),
);

/**
 * Converte um par `subject`/`action` persistido (strings) no valor correspondente do catálogo.
 * Retorna `null` se o par não existir em {@link Claim} (ex.: typo no banco ou par inválido).
 * Não tem relação com migração de colunas; é só o limite entre persistência e domínio.
 */
export function claimFromSubjectAction(subject: string, action: string): ClaimValue | null {
  return CLAIM_BY_SUBJECT_ACTION.get(generateMapKey(subject, action)) ?? null;
}

export function generateMapKey(subject: string, action: string): string {
  return `${subject}:${action}`;
}
