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

//   CLIENT_CREATE: { subject: ClaimSubject.Client, action: ClaimAction.Create },
//   CLIENT_LIST: { subject: ClaimSubject.Client, action: ClaimAction.List },
//   CLIENT_DETAIL: { subject: ClaimSubject.Client, action: ClaimAction.Detail },
//   CLIENT_UPDATE: { subject: ClaimSubject.Client, action: ClaimAction.Update },
//   CLIENT_ACTIVATE: { subject: ClaimSubject.Client, action: ClaimAction.Activate },
//   CLIENT_DEACTIVATE: { subject: ClaimSubject.Client, action: ClaimAction.Deactivate },

//   CLIENT_ITEM_CREATE: { subject: ClaimSubject.ClientItem, action: ClaimAction.Create },
//   CLIENT_ITEM_BULK_CREATE: { subject: ClaimSubject.ClientItem, action: ClaimAction.BulkCreate },
//   CLIENT_ITEM_LIST: { subject: ClaimSubject.ClientItem, action: ClaimAction.List },
//   CLIENT_ITEM_DETAIL: { subject: ClaimSubject.ClientItem, action: ClaimAction.Detail },
//   CLIENT_ITEM_UPDATE: { subject: ClaimSubject.ClientItem, action: ClaimAction.Update },
//   CLIENT_ITEM_BULK_DELETE: { subject: ClaimSubject.ClientItem, action: ClaimAction.BulkDelete },
//   CLIENT_ITEM_DELETE: { subject: ClaimSubject.ClientItem, action: ClaimAction.Delete },

//   CLIENT_ADDRESS_CREATE: { subject: ClaimSubject.ClientAddress, action: ClaimAction.Create },
//   CLIENT_ADDRESS_LIST: { subject: ClaimSubject.ClientAddress, action: ClaimAction.List },
//   CLIENT_ADDRESS_DETAIL: { subject: ClaimSubject.ClientAddress, action: ClaimAction.Detail },
//   CLIENT_ADDRESS_UPDATE: { subject: ClaimSubject.ClientAddress, action: ClaimAction.Update },
//   CLIENT_ADDRESS_ACTIVATE: { subject: ClaimSubject.ClientAddress, action: ClaimAction.Activate },
//   CLIENT_ADDRESS_DEACTIVATE: { subject: ClaimSubject.ClientAddress, action: ClaimAction.Deactivate },
//   CLIENT_ADDRESS_DELETE: { subject: ClaimSubject.ClientAddress, action: ClaimAction.Delete },

//   CLIENT_ATTACHMENT_CREATE: { subject: ClaimSubject.ClientAttachment, action: ClaimAction.Create },
//   CLIENT_ATTACHMENT_LIST: { subject: ClaimSubject.ClientAttachment, action: ClaimAction.List },
//   CLIENT_ATTACHMENT_DETAIL: { subject: ClaimSubject.ClientAttachment, action: ClaimAction.Detail },
//   CLIENT_ATTACHMENT_UPDATE: { subject: ClaimSubject.ClientAttachment, action: ClaimAction.Update },
//   CLIENT_ATTACHMENT_UPDATE_STATUS: { subject: ClaimSubject.ClientAttachment, action: ClaimAction.UpdateStatus },
//   CLIENT_ATTACHMENT_DELETE: { subject: ClaimSubject.ClientAttachment, action: ClaimAction.Delete },

//   CLIENT_CONTACT_CREATE: { subject: ClaimSubject.ClientContact, action: ClaimAction.Create },
//   CLIENT_CONTACT_LIST: { subject: ClaimSubject.ClientContact, action: ClaimAction.List },
//   CLIENT_CONTACT_DETAIL: { subject: ClaimSubject.ClientContact, action: ClaimAction.Detail },
//   CLIENT_CONTACT_UPDATE: { subject: ClaimSubject.ClientContact, action: ClaimAction.Update },
//   CLIENT_CONTACT_ACTIVATE: { subject: ClaimSubject.ClientContact, action: ClaimAction.Activate },
//   CLIENT_CONTACT_DEACTIVATE: { subject: ClaimSubject.ClientContact, action: ClaimAction.Deactivate },
//   CLIENT_CONTACT_DELETE: { subject: ClaimSubject.ClientContact, action: ClaimAction.Delete },

//   CLIENT_DEPARTMENT_CREATE: { subject: ClaimSubject.ClientDepartment, action: ClaimAction.Create },
//   CLIENT_DEPARTMENT_LIST: { subject: ClaimSubject.ClientDepartment, action: ClaimAction.List },
//   CLIENT_DEPARTMENT_DETAIL: { subject: ClaimSubject.ClientDepartment, action: ClaimAction.Detail },
//   CLIENT_DEPARTMENT_UPDATE: { subject: ClaimSubject.ClientDepartment, action: ClaimAction.Update },
//   CLIENT_DEPARTMENT_UPDATE_STATUS: { subject: ClaimSubject.ClientDepartment, action: ClaimAction.UpdateStatus },
//   CLIENT_DEPARTMENT_DELETE: { subject: ClaimSubject.ClientDepartment, action: ClaimAction.Delete },

//   CLIENT_DISCOUNT_CREATE: { subject: ClaimSubject.ClientDiscount, action: ClaimAction.Create },
//   CLIENT_DISCOUNT_LIST: { subject: ClaimSubject.ClientDiscount, action: ClaimAction.List },
//   CLIENT_DISCOUNT_DETAIL: { subject: ClaimSubject.ClientDiscount, action: ClaimAction.Detail },
//   CLIENT_DISCOUNT_UPDATE: { subject: ClaimSubject.ClientDiscount, action: ClaimAction.Update },
//   CLIENT_DISCOUNT_DELETE: { subject: ClaimSubject.ClientDiscount, action: ClaimAction.Delete },

//   CLIENT_GROUP_CREATE: { subject: ClaimSubject.ClientGroup, action: ClaimAction.Create },
//   CLIENT_GROUP_LIST: { subject: ClaimSubject.ClientGroup, action: ClaimAction.List },
//   CLIENT_GROUP_DETAIL: { subject: ClaimSubject.ClientGroup, action: ClaimAction.Detail },
//   CLIENT_GROUP_UPDATE: { subject: ClaimSubject.ClientGroup, action: ClaimAction.Update },
//   CLIENT_GROUP_UPDATE_STATUS: { subject: ClaimSubject.ClientGroup, action: ClaimAction.UpdateStatus },
//   CLIENT_GROUP_DELETE: { subject: ClaimSubject.ClientGroup, action: ClaimAction.Delete },

//   CLIENT_INVOICE_CONFIG_CREATE: { subject: ClaimSubject.ClientInvoiceConfig, action: ClaimAction.Create },
//   CLIENT_INVOICE_CONFIG_DETAIL: { subject: ClaimSubject.ClientInvoiceConfig, action: ClaimAction.Detail },
//   CLIENT_INVOICE_CONFIG_UPDATE: { subject: ClaimSubject.ClientInvoiceConfig, action: ClaimAction.Update },
//   CLIENT_INVOICE_CONFIG_DELETE: { subject: ClaimSubject.ClientInvoiceConfig, action: ClaimAction.Delete },

//   CLIENT_OWNER_CREATE: { subject: ClaimSubject.ClientOwner, action: ClaimAction.Create },
//   CLIENT_OWNER_LIST: { subject: ClaimSubject.ClientOwner, action: ClaimAction.List },
//   CLIENT_OWNER_DETAIL: { subject: ClaimSubject.ClientOwner, action: ClaimAction.Detail },
//   CLIENT_OWNER_UPDATE: { subject: ClaimSubject.ClientOwner, action: ClaimAction.Update },
//   CLIENT_OWNER_UPDATE_STATUS: { subject: ClaimSubject.ClientOwner, action: ClaimAction.UpdateStatus },
//   CLIENT_OWNER_DELETE: { subject: ClaimSubject.ClientOwner, action: ClaimAction.Delete },

//   CLIENT_TYPE_CREATE: { subject: ClaimSubject.ClientType, action: ClaimAction.Create },
//   CLIENT_TYPE_LIST: { subject: ClaimSubject.ClientType, action: ClaimAction.List },
//   CLIENT_TYPE_DETAIL: { subject: ClaimSubject.ClientType, action: ClaimAction.Detail },
//   CLIENT_TYPE_UPDATE: { subject: ClaimSubject.ClientType, action: ClaimAction.Update },
//   CLIENT_TYPE_UPDATE_STATUS: { subject: ClaimSubject.ClientType, action: ClaimAction.UpdateStatus },
//   CLIENT_TYPE_BULK_DELETE: { subject: ClaimSubject.ClientType, action: ClaimAction.BulkDelete },
//   CLIENT_TYPE_DELETE: { subject: ClaimSubject.ClientType, action: ClaimAction.Delete },

//   CLIENT_ATTENDANCE_TYPE_CREATE: { subject: ClaimSubject.ClientAttendanceType, action: ClaimAction.Create },
//   CLIENT_ATTENDANCE_TYPE_LIST: { subject: ClaimSubject.ClientAttendanceType, action: ClaimAction.List },
//   CLIENT_ATTENDANCE_TYPE_DETAIL: { subject: ClaimSubject.ClientAttendanceType, action: ClaimAction.Detail },
//   CLIENT_ATTENDANCE_TYPE_UPDATE: { subject: ClaimSubject.ClientAttendanceType, action: ClaimAction.Update },
//   CLIENT_ATTENDANCE_TYPE_UPDATE_STATUS: { subject: ClaimSubject.ClientAttendanceType, action: ClaimAction.UpdateStatus },
//   CLIENT_ATTENDANCE_TYPE_DELETE: { subject: ClaimSubject.ClientAttendanceType, action: ClaimAction.Delete },

//   CLIENT_DESCRIPTION_TYPE_CREATE: { subject: ClaimSubject.ClientDescriptionType, action: ClaimAction.Create },
//   CLIENT_DESCRIPTION_TYPE_LIST: { subject: ClaimSubject.ClientDescriptionType, action: ClaimAction.List },
//   CLIENT_DESCRIPTION_TYPE_DETAIL: { subject: ClaimSubject.ClientDescriptionType, action: ClaimAction.Detail },
//   CLIENT_DESCRIPTION_TYPE_UPDATE: { subject: ClaimSubject.ClientDescriptionType, action: ClaimAction.Update },
//   CLIENT_DESCRIPTION_TYPE_UPDATE_STATUS: { subject: ClaimSubject.ClientDescriptionType, action: ClaimAction.UpdateStatus },
//   CLIENT_DESCRIPTION_TYPE_DELETE: { subject: ClaimSubject.ClientDescriptionType, action: ClaimAction.Delete },

//   CLIENT_DRIVE_TYPE_CREATE: { subject: ClaimSubject.ClientDriveType, action: ClaimAction.Create },
//   CLIENT_DRIVE_TYPE_LIST: { subject: ClaimSubject.ClientDriveType, action: ClaimAction.List },
//   CLIENT_DRIVE_TYPE_DETAIL: { subject: ClaimSubject.ClientDriveType, action: ClaimAction.Detail },
//   CLIENT_DRIVE_TYPE_UPDATE: { subject: ClaimSubject.ClientDriveType, action: ClaimAction.Update },
//   CLIENT_DRIVE_TYPE_UPDATE_STATUS: { subject: ClaimSubject.ClientDriveType, action: ClaimAction.UpdateStatus },
//   CLIENT_DRIVE_TYPE_DELETE: { subject: ClaimSubject.ClientDriveType, action: ClaimAction.Delete },

//   CLIENT_MAINTENANCE_TICKET_TYPE_CREATE: { subject: ClaimSubject.ClientMaintenanceTicketType, action: ClaimAction.Create },
//   CLIENT_MAINTENANCE_TICKET_TYPE_LIST: { subject: ClaimSubject.ClientMaintenanceTicketType, action: ClaimAction.List },
//   CLIENT_MAINTENANCE_TICKET_TYPE_DETAIL: { subject: ClaimSubject.ClientMaintenanceTicketType, action: ClaimAction.Detail },
//   CLIENT_MAINTENANCE_TICKET_TYPE_UPDATE: { subject: ClaimSubject.ClientMaintenanceTicketType, action: ClaimAction.Update },
//   CLIENT_MAINTENANCE_TICKET_TYPE_UPDATE_STATUS: { subject: ClaimSubject.ClientMaintenanceTicketType, action: ClaimAction.UpdateStatus },
//   CLIENT_MAINTENANCE_TICKET_TYPE_DELETE: { subject: ClaimSubject.ClientMaintenanceTicketType, action: ClaimAction.Delete },

//   CLIENT_SYSTEM_TYPE_CREATE: { subject: ClaimSubject.ClientSystemType, action: ClaimAction.Create },
//   CLIENT_SYSTEM_TYPE_LIST: { subject: ClaimSubject.ClientSystemType, action: ClaimAction.List },
//   CLIENT_SYSTEM_TYPE_DETAIL: { subject: ClaimSubject.ClientSystemType, action: ClaimAction.Detail },
//   CLIENT_SYSTEM_TYPE_UPDATE: { subject: ClaimSubject.ClientSystemType, action: ClaimAction.Update },
//   CLIENT_SYSTEM_TYPE_UPDATE_STATUS: { subject: ClaimSubject.ClientSystemType, action: ClaimAction.UpdateStatus },
//   CLIENT_SYSTEM_TYPE_DELETE: { subject: ClaimSubject.ClientSystemType, action: ClaimAction.Delete },

//   COMPANY_CREATE: { subject: ClaimSubject.Company, action: ClaimAction.Create },
//   COMPANY_LIST: { subject: ClaimSubject.Company, action: ClaimAction.List },
//   COMPANY_DETAIL: { subject: ClaimSubject.Company, action: ClaimAction.Detail },
//   COMPANY_UPDATE: { subject: ClaimSubject.Company, action: ClaimAction.Update },
//   COMPANY_ACTIVATE: { subject: ClaimSubject.Company, action: ClaimAction.Activate },
//   COMPANY_DEACTIVATE: { subject: ClaimSubject.Company, action: ClaimAction.Deactivate },

//   ADMIN_CREATE: { subject: ClaimSubject.Admin, action: ClaimAction.Create },
//   ADMIN_LIST: { subject: ClaimSubject.Admin, action: ClaimAction.List },
//   ADMIN_DETAIL: { subject: ClaimSubject.Admin, action: ClaimAction.Detail },
//   ADMIN_UPDATE: { subject: ClaimSubject.Admin, action: ClaimAction.Update },
//   ADMIN_ACTIVATE: { subject: ClaimSubject.Admin, action: ClaimAction.Activate },
//   ADMIN_DEACTIVATE: { subject: ClaimSubject.Admin, action: ClaimAction.Deactivate },

//   FAQ_CREATE: { subject: ClaimSubject.Faq, action: ClaimAction.Create },
//   FAQ_LIST: { subject: ClaimSubject.Faq, action: ClaimAction.List },
//   FAQ_DETAIL: { subject: ClaimSubject.Faq, action: ClaimAction.Detail },
//   FAQ_UPDATE: { subject: ClaimSubject.Faq, action: ClaimAction.Update },
//   FAQ_UPDATE_STATUS: { subject: ClaimSubject.Faq, action: ClaimAction.UpdateStatus },
//   FAQ_DELETE: { subject: ClaimSubject.Faq, action: ClaimAction.Delete },

//   SERVICE_ATTENDANCE_VALUE_CREATE: { subject: ClaimSubject.ServiceAttendanceValue, action: ClaimAction.Create },
//   SERVICE_ATTENDANCE_VALUE_LIST: { subject: ClaimSubject.ServiceAttendanceValue, action: ClaimAction.List },
//   SERVICE_ATTENDANCE_VALUE_DETAIL: { subject: ClaimSubject.ServiceAttendanceValue, action: ClaimAction.Detail },
//   SERVICE_ATTENDANCE_VALUE_UPDATE: { subject: ClaimSubject.ServiceAttendanceValue, action: ClaimAction.Update },
//   SERVICE_ATTENDANCE_VALUE_DELETE: { subject: ClaimSubject.ServiceAttendanceValue, action: ClaimAction.Delete },

//   SERVICE_BILLED_CREATE: { subject: ClaimSubject.ServiceBilled, action: ClaimAction.Create },
//   SERVICE_BILLED_LIST: { subject: ClaimSubject.ServiceBilled, action: ClaimAction.List },
//   SERVICE_BILLED_DETAIL: { subject: ClaimSubject.ServiceBilled, action: ClaimAction.Detail },
//   SERVICE_BILLED_UPDATE: { subject: ClaimSubject.ServiceBilled, action: ClaimAction.Update },
//   SERVICE_BILLED_ACTIVATE: { subject: ClaimSubject.ServiceBilled, action: ClaimAction.Activate },
//   SERVICE_BILLED_DEACTIVATE: { subject: ClaimSubject.ServiceBilled, action: ClaimAction.Deactivate },
//   SERVICE_BILLED_DELETE: { subject: ClaimSubject.ServiceBilled, action: ClaimAction.Delete },

//   SERVICE_CATALOG_CREATE: { subject: ClaimSubject.ServiceCatalog, action: ClaimAction.Create },
//   SERVICE_CATALOG_LIST: { subject: ClaimSubject.ServiceCatalog, action: ClaimAction.List },
//   SERVICE_CATALOG_DETAIL: { subject: ClaimSubject.ServiceCatalog, action: ClaimAction.Detail },
//   SERVICE_CATALOG_UPDATE: { subject: ClaimSubject.ServiceCatalog, action: ClaimAction.Update },
//   SERVICE_CATALOG_ACTIVATE: { subject: ClaimSubject.ServiceCatalog, action: ClaimAction.Activate },
//   SERVICE_CATALOG_DEACTIVATE: { subject: ClaimSubject.ServiceCatalog, action: ClaimAction.Deactivate },
//   SERVICE_CATALOG_DELETE: { subject: ClaimSubject.ServiceCatalog, action: ClaimAction.Delete },

//   SERVICE_CATEGORY_CREATE: { subject: ClaimSubject.ServiceCategory, action: ClaimAction.Create },
//   SERVICE_CATEGORY_LIST: { subject: ClaimSubject.ServiceCategory, action: ClaimAction.List },
//   SERVICE_CATEGORY_DETAIL: { subject: ClaimSubject.ServiceCategory, action: ClaimAction.Detail },
//   SERVICE_CATEGORY_UPDATE: { subject: ClaimSubject.ServiceCategory, action: ClaimAction.Update },
//   SERVICE_CATEGORY_UPDATE_STATUS: { subject: ClaimSubject.ServiceCategory, action: ClaimAction.UpdateStatus },
//   SERVICE_CATEGORY_DELETE: { subject: ClaimSubject.ServiceCategory, action: ClaimAction.Delete },

//   SERVICE_DELIVERY_TERM_CREATE: { subject: ClaimSubject.ServiceDeliveryTerm, action: ClaimAction.Create },
//   SERVICE_DELIVERY_TERM_LIST: { subject: ClaimSubject.ServiceDeliveryTerm, action: ClaimAction.List },
//   SERVICE_DELIVERY_TERM_DETAIL: { subject: ClaimSubject.ServiceDeliveryTerm, action: ClaimAction.Detail },
//   SERVICE_DELIVERY_TERM_UPDATE: { subject: ClaimSubject.ServiceDeliveryTerm, action: ClaimAction.Update },
//   SERVICE_DELIVERY_TERM_UPDATE_STATUS: { subject: ClaimSubject.ServiceDeliveryTerm, action: ClaimAction.UpdateStatus },
//   SERVICE_DELIVERY_TERM_DELETE: { subject: ClaimSubject.ServiceDeliveryTerm, action: ClaimAction.Delete },

//   SERVICE_FREIGHT_CREATE: { subject: ClaimSubject.ServiceFreight, action: ClaimAction.Create },
//   SERVICE_FREIGHT_LIST: { subject: ClaimSubject.ServiceFreight, action: ClaimAction.List },
//   SERVICE_FREIGHT_DETAIL: { subject: ClaimSubject.ServiceFreight, action: ClaimAction.Detail },
//   SERVICE_FREIGHT_UPDATE: { subject: ClaimSubject.ServiceFreight, action: ClaimAction.Update },
//   SERVICE_FREIGHT_UPDATE_STATUS: { subject: ClaimSubject.ServiceFreight, action: ClaimAction.UpdateStatus },
//   SERVICE_FREIGHT_DELETE: { subject: ClaimSubject.ServiceFreight, action: ClaimAction.Delete },

//   SERVICE_PROPOSAL_VALIDITY_CREATE: { subject: ClaimSubject.ServiceProposalValidity, action: ClaimAction.Create },
//   SERVICE_PROPOSAL_VALIDITY_LIST: { subject: ClaimSubject.ServiceProposalValidity, action: ClaimAction.List },
//   SERVICE_PROPOSAL_VALIDITY_DETAIL: { subject: ClaimSubject.ServiceProposalValidity, action: ClaimAction.Detail },
//   SERVICE_PROPOSAL_VALIDITY_UPDATE: { subject: ClaimSubject.ServiceProposalValidity, action: ClaimAction.Update },
//   SERVICE_PROPOSAL_VALIDITY_UPDATE_STATUS: { subject: ClaimSubject.ServiceProposalValidity, action: ClaimAction.UpdateStatus },
//   SERVICE_PROPOSAL_VALIDITY_DELETE: { subject: ClaimSubject.ServiceProposalValidity, action: ClaimAction.Delete },

//   SERVICE_WARRANTY_CREATE: { subject: ClaimSubject.ServiceWarranty, action: ClaimAction.Create },
//   SERVICE_WARRANTY_LIST: { subject: ClaimSubject.ServiceWarranty, action: ClaimAction.List },
//   SERVICE_WARRANTY_DETAIL: { subject: ClaimSubject.ServiceWarranty, action: ClaimAction.Detail },
//   SERVICE_WARRANTY_UPDATE: { subject: ClaimSubject.ServiceWarranty, action: ClaimAction.Update },
//   SERVICE_WARRANTY_UPDATE_STATUS: { subject: ClaimSubject.ServiceWarranty, action: ClaimAction.UpdateStatus },
//   SERVICE_WARRANTY_DELETE: { subject: ClaimSubject.ServiceWarranty, action: ClaimAction.Delete },

//   CNAE_CREATE: { subject: ClaimSubject.Cnae, action: ClaimAction.Create },
//   CNAE_LIST: { subject: ClaimSubject.Cnae, action: ClaimAction.List },
//   CNAE_DETAIL: { subject: ClaimSubject.Cnae, action: ClaimAction.Detail },
//   CNAE_UPDATE: { subject: ClaimSubject.Cnae, action: ClaimAction.Update },
//   CNAE_UPDATE_STATUS: { subject: ClaimSubject.Cnae, action: ClaimAction.UpdateStatus },
//   CNAE_DELETE: { subject: ClaimSubject.Cnae, action: ClaimAction.Delete },

//   NBS_CREATE: { subject: ClaimSubject.Nbs, action: ClaimAction.Create },
//   NBS_LIST: { subject: ClaimSubject.Nbs, action: ClaimAction.List },
//   NBS_DETAIL: { subject: ClaimSubject.Nbs, action: ClaimAction.Detail },
//   NBS_UPDATE: { subject: ClaimSubject.Nbs, action: ClaimAction.Update },
//   NBS_UPDATE_STATUS: { subject: ClaimSubject.Nbs, action: ClaimAction.UpdateStatus },
//   NBS_DELETE: { subject: ClaimSubject.Nbs, action: ClaimAction.Delete },

//   INDOP_CREATE: { subject: ClaimSubject.Indop, action: ClaimAction.Create },
//   INDOP_LIST: { subject: ClaimSubject.Indop, action: ClaimAction.List },
//   INDOP_DETAIL: { subject: ClaimSubject.Indop, action: ClaimAction.Detail },
//   INDOP_UPDATE: { subject: ClaimSubject.Indop, action: ClaimAction.Update },
//   INDOP_UPDATE_STATUS: { subject: ClaimSubject.Indop, action: ClaimAction.UpdateStatus },
//   INDOP_DELETE: { subject: ClaimSubject.Indop, action: ClaimAction.Delete },

//   CNAE_NBS_INDOP_CREATE: { subject: ClaimSubject.CnaeNbsIndop, action: ClaimAction.Create },
//   CNAE_NBS_INDOP_LIST: { subject: ClaimSubject.CnaeNbsIndop, action: ClaimAction.List },
//   CNAE_NBS_INDOP_LIST_CNAES: { subject: ClaimSubject.CnaeNbsIndop, action: ClaimAction.List },
//   CNAE_NBS_INDOP_LIST_NBS: { subject: ClaimSubject.CnaeNbsIndop, action: ClaimAction.List },
//   CNAE_NBS_INDOP_LIST_INDOPS: { subject: ClaimSubject.CnaeNbsIndop, action: ClaimAction.List },
//   CNAE_NBS_INDOP_UPDATE_STATUS: { subject: ClaimSubject.CnaeNbsIndop, action: ClaimAction.UpdateStatus },
//   CNAE_NBS_INDOP_DELETE: { subject: ClaimSubject.CnaeNbsIndop, action: ClaimAction.Delete },
// } as const;

export const Claim = {
  ADMIN_READ: { subject: ClaimSubject.Admin, action: ClaimAction.Read },
  ADMIN_WRITE: { subject: ClaimSubject.Admin, action: ClaimAction.Write },

  BANK_READ: { subject: ClaimSubject.Bank, action: ClaimAction.Read },
  BANK_WRITE: { subject: ClaimSubject.Bank, action: ClaimAction.Write },

  CLIENT_READ: { subject: ClaimSubject.Client, action: ClaimAction.Read },
  CLIENT_WRITE: { subject: ClaimSubject.Client, action: ClaimAction.Write },

  CLIENT_ADDRESS_READ: { subject: ClaimSubject.ClientAddress, action: ClaimAction.Read },
  CLIENT_ADDRESS_WRITE: { subject: ClaimSubject.ClientAddress, action: ClaimAction.Write },

  CLIENT_ATTACHMENT_READ: { subject: ClaimSubject.ClientAttachment, action: ClaimAction.Read },
  CLIENT_ATTACHMENT_WRITE: { subject: ClaimSubject.ClientAttachment, action: ClaimAction.Write },

  CLIENT_ATTENDANCE_TYPE_READ: { subject: ClaimSubject.ClientAttendanceType, action: ClaimAction.Read },
  CLIENT_ATTENDANCE_TYPE_WRITE: { subject: ClaimSubject.ClientAttendanceType, action: ClaimAction.Write },

  CLIENT_CONTACT_READ: { subject: ClaimSubject.ClientContact, action: ClaimAction.Read },
  CLIENT_CONTACT_WRITE: { subject: ClaimSubject.ClientContact, action: ClaimAction.Write },

  CLIENT_DEPARTMENT_READ: { subject: ClaimSubject.ClientDepartment, action: ClaimAction.Read },
  CLIENT_DEPARTMENT_WRITE: { subject: ClaimSubject.ClientDepartment, action: ClaimAction.Write },

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

  CLIENT_MAINTENANCE_TICKET_TYPE_READ: { subject: ClaimSubject.ClientMaintenanceTicketType, action: ClaimAction.Read },
  CLIENT_MAINTENANCE_TICKET_TYPE_WRITE: { subject: ClaimSubject.ClientMaintenanceTicketType, action: ClaimAction.Write },

  CLIENT_OWNER_READ: { subject: ClaimSubject.ClientOwner, action: ClaimAction.Read },
  CLIENT_OWNER_WRITE: { subject: ClaimSubject.ClientOwner, action: ClaimAction.Write },

  CLIENT_SYSTEM_TYPE_READ: { subject: ClaimSubject.ClientSystemType, action: ClaimAction.Read },
  CLIENT_SYSTEM_TYPE_WRITE: { subject: ClaimSubject.ClientSystemType, action: ClaimAction.Write },

  CLIENT_TYPE_READ: { subject: ClaimSubject.ClientType, action: ClaimAction.Read },
  CLIENT_TYPE_WRITE: { subject: ClaimSubject.ClientType, action: ClaimAction.Write },

  CNAE_READ: { subject: ClaimSubject.Cnae, action: ClaimAction.Read },
  CNAE_WRITE: { subject: ClaimSubject.Cnae, action: ClaimAction.Write },

  CNAE_NBS_INDOP_READ: { subject: ClaimSubject.CnaeNbsIndop, action: ClaimAction.Read },
  CNAE_NBS_INDOP_WRITE: { subject: ClaimSubject.CnaeNbsIndop, action: ClaimAction.Write },

  COMPANY_READ: { subject: ClaimSubject.Company, action: ClaimAction.Read },
  COMPANY_WRITE: { subject: ClaimSubject.Company, action: ClaimAction.Write },

  FAQ_READ: { subject: ClaimSubject.Faq, action: ClaimAction.Read },
  FAQ_WRITE: { subject: ClaimSubject.Faq, action: ClaimAction.Write },

  INDOP_READ: { subject: ClaimSubject.Indop, action: ClaimAction.Read },
  INDOP_WRITE: { subject: ClaimSubject.Indop, action: ClaimAction.Write },

  NBS_READ: { subject: ClaimSubject.Nbs, action: ClaimAction.Read },
  NBS_WRITE: { subject: ClaimSubject.Nbs, action: ClaimAction.Write },

  SERVICE_ATTENDANCE_VALUE_READ: { subject: ClaimSubject.ServiceAttendanceValue, action: ClaimAction.Read },
  SERVICE_ATTENDANCE_VALUE_WRITE: { subject: ClaimSubject.ServiceAttendanceValue, action: ClaimAction.Write },

  SERVICE_BILLED_READ: { subject: ClaimSubject.ServiceBilled, action: ClaimAction.Read },
  SERVICE_BILLED_WRITE: { subject: ClaimSubject.ServiceBilled, action: ClaimAction.Write },

  SERVICE_CATALOG_READ: { subject: ClaimSubject.ServiceCatalog, action: ClaimAction.Read },
  SERVICE_CATALOG_WRITE: { subject: ClaimSubject.ServiceCatalog, action: ClaimAction.Write },

  SERVICE_CATEGORY_READ: { subject: ClaimSubject.ServiceCategory, action: ClaimAction.Read },
  SERVICE_CATEGORY_WRITE: { subject: ClaimSubject.ServiceCategory, action: ClaimAction.Write },

  SERVICE_DELIVERY_TERM_READ: { subject: ClaimSubject.ServiceDeliveryTerm, action: ClaimAction.Read },
  SERVICE_DELIVERY_TERM_WRITE: { subject: ClaimSubject.ServiceDeliveryTerm, action: ClaimAction.Write },

  SERVICE_FREIGHT_READ: { subject: ClaimSubject.ServiceFreight, action: ClaimAction.Read },
  SERVICE_FREIGHT_WRITE: { subject: ClaimSubject.ServiceFreight, action: ClaimAction.Write },

  SERVICE_PROPOSAL_VALIDITY_READ: { subject: ClaimSubject.ServiceProposalValidity, action: ClaimAction.Read },
  SERVICE_PROPOSAL_VALIDITY_WRITE: { subject: ClaimSubject.ServiceProposalValidity, action: ClaimAction.Write },

  SERVICE_WARRANTY_READ: { subject: ClaimSubject.ServiceWarranty, action: ClaimAction.Read },
  SERVICE_WARRANTY_WRITE: { subject: ClaimSubject.ServiceWarranty, action: ClaimAction.Write },
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
