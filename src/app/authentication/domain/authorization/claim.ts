/**
 * Domínio de permissões em string e integração com CASL.
 *
 * **O que é CASL (neste projeto)**
 * A biblioteca `@casl/ability` modela o que o usuário **pode fazer** como regras `can(ação, assunto)`.
 * Aqui cada permissão administrativa vira uma string `assunto:ação` (ex.: `bank:list`), que é convertida
 * em regras CASL em {@link CaslAbilityFactory} e verificada nos guards com `ability.can(ação, assunto)`.
 *
 * **Fluxo de dados**
 * - **Admin:** claims vêm do banco (`AccountClaim`); se a lista estiver vazia, o factory aplica
 *   {@link ALL_CLAIM_VALUES} (acesso total às rotas protegidas por claim).
 * - **Demais papéis:** {@link STATIC_CLAIMS} (fixo no código).
 *
 * **Constantes `Claim`**
 * Cada ação HTTP de admin mapeia para um claim tipado; usar essas constantes evita typos nas rotas e no metadata.
 */
export const Claim = {
  BANK_CREATE: 'bank:create',
  BANK_LIST: 'bank:list',
  BANK_READ: 'bank:read',
  BANK_UPDATE: 'bank:update',
  BANK_UPDATE_STATUS: 'bank:updateStatus',

  CLIENT_CREATE: 'client:create',
  CLIENT_LIST: 'client:list',
  CLIENT_READ: 'client:read',
  CLIENT_UPDATE: 'client:update',
  CLIENT_ACTIVATE: 'client:activate',
  CLIENT_DEACTIVATE: 'client:deactivate',

  CLIENT_ITEM_CREATE: 'client-item:create',
  CLIENT_ITEM_BULK_CREATE: 'client-item:bulkCreate',
  CLIENT_ITEM_LIST: 'client-item:list',
  CLIENT_ITEM_READ: 'client-item:read',
  CLIENT_ITEM_UPDATE: 'client-item:update',
  CLIENT_ITEM_BULK_DELETE: 'client-item:bulkDelete',
  CLIENT_ITEM_DELETE: 'client-item:delete',

  CLIENT_ADDRESS_CREATE: 'client-address:create',
  CLIENT_ADDRESS_LIST: 'client-address:list',
  CLIENT_ADDRESS_READ: 'client-address:read',
  CLIENT_ADDRESS_UPDATE: 'client-address:update',
  CLIENT_ADDRESS_ACTIVATE: 'client-address:activate',
  CLIENT_ADDRESS_DEACTIVATE: 'client-address:deactivate',
  CLIENT_ADDRESS_DELETE: 'client-address:delete',

  CLIENT_ATTACHMENT_CREATE: 'client-attachment:create',
  CLIENT_ATTACHMENT_LIST: 'client-attachment:list',
  CLIENT_ATTACHMENT_READ: 'client-attachment:read',
  CLIENT_ATTACHMENT_UPDATE: 'client-attachment:update',
  CLIENT_ATTACHMENT_UPDATE_STATUS: 'client-attachment:updateStatus',
  CLIENT_ATTACHMENT_DELETE: 'client-attachment:delete',

  CLIENT_CONTACT_CREATE: 'client-contact:create',
  CLIENT_CONTACT_LIST: 'client-contact:list',
  CLIENT_CONTACT_READ: 'client-contact:read',
  CLIENT_CONTACT_UPDATE: 'client-contact:update',
  CLIENT_CONTACT_ACTIVATE: 'client-contact:activate',
  CLIENT_CONTACT_DEACTIVATE: 'client-contact:deactivate',
  CLIENT_CONTACT_DELETE: 'client-contact:delete',

  CLIENT_DEPARTMENT_CREATE: 'client-department:create',
  CLIENT_DEPARTMENT_LIST: 'client-department:list',
  CLIENT_DEPARTMENT_READ: 'client-department:read',
  CLIENT_DEPARTMENT_UPDATE: 'client-department:update',
  CLIENT_DEPARTMENT_UPDATE_STATUS: 'client-department:updateStatus',
  CLIENT_DEPARTMENT_DELETE: 'client-department:delete',

  CLIENT_DISCOUNT_CREATE: 'client-discount:create',
  CLIENT_DISCOUNT_LIST: 'client-discount:list',
  CLIENT_DISCOUNT_READ: 'client-discount:read',
  CLIENT_DISCOUNT_UPDATE: 'client-discount:update',
  CLIENT_DISCOUNT_DELETE: 'client-discount:delete',

  CLIENT_GROUP_CREATE: 'client-group:create',
  CLIENT_GROUP_LIST: 'client-group:list',
  CLIENT_GROUP_READ: 'client-group:read',
  CLIENT_GROUP_UPDATE: 'client-group:update',
  CLIENT_GROUP_UPDATE_STATUS: 'client-group:updateStatus',
  CLIENT_GROUP_DELETE: 'client-group:delete',

  CLIENT_INVOICE_CONFIG_CREATE: 'client-invoice-config:create',
  CLIENT_INVOICE_CONFIG_READ: 'client-invoice-config:read',
  CLIENT_INVOICE_CONFIG_UPDATE: 'client-invoice-config:update',
  CLIENT_INVOICE_CONFIG_DELETE: 'client-invoice-config:delete',

  CLIENT_OWNER_CREATE: 'client-owner:create',
  CLIENT_OWNER_LIST: 'client-owner:list',
  CLIENT_OWNER_READ: 'client-owner:read',
  CLIENT_OWNER_UPDATE: 'client-owner:update',
  CLIENT_OWNER_UPDATE_STATUS: 'client-owner:updateStatus',
  CLIENT_OWNER_DELETE: 'client-owner:delete',

  CLIENT_TYPE_CREATE: 'client-type:create',
  CLIENT_TYPE_LIST: 'client-type:list',
  CLIENT_TYPE_READ: 'client-type:read',
  CLIENT_TYPE_UPDATE: 'client-type:update',
  CLIENT_TYPE_UPDATE_STATUS: 'client-type:updateStatus',
  CLIENT_TYPE_BULK_DELETE: 'client-type:bulkDelete',
  CLIENT_TYPE_DELETE: 'client-type:delete',

  CLIENT_ATTENDANCE_TYPE_CREATE: 'client-attendance-type:create',
  CLIENT_ATTENDANCE_TYPE_LIST: 'client-attendance-type:list',
  CLIENT_ATTENDANCE_TYPE_READ: 'client-attendance-type:read',
  CLIENT_ATTENDANCE_TYPE_UPDATE: 'client-attendance-type:update',
  CLIENT_ATTENDANCE_TYPE_UPDATE_STATUS: 'client-attendance-type:updateStatus',
  CLIENT_ATTENDANCE_TYPE_DELETE: 'client-attendance-type:delete',

  CLIENT_DESCRIPTION_TYPE_CREATE: 'client-description-type:create',
  CLIENT_DESCRIPTION_TYPE_LIST: 'client-description-type:list',
  CLIENT_DESCRIPTION_TYPE_READ: 'client-description-type:read',
  CLIENT_DESCRIPTION_TYPE_UPDATE: 'client-description-type:update',
  CLIENT_DESCRIPTION_TYPE_UPDATE_STATUS: 'client-description-type:updateStatus',
  CLIENT_DESCRIPTION_TYPE_DELETE: 'client-description-type:delete',

  CLIENT_DRIVE_TYPE_CREATE: 'client-drive-type:create',
  CLIENT_DRIVE_TYPE_LIST: 'client-drive-type:list',
  CLIENT_DRIVE_TYPE_READ: 'client-drive-type:read',
  CLIENT_DRIVE_TYPE_UPDATE: 'client-drive-type:update',
  CLIENT_DRIVE_TYPE_UPDATE_STATUS: 'client-drive-type:updateStatus',
  CLIENT_DRIVE_TYPE_DELETE: 'client-drive-type:delete',

  CLIENT_MAINTENANCE_TICKET_TYPE_CREATE: 'client-maintenance-ticket-type:create',
  CLIENT_MAINTENANCE_TICKET_TYPE_LIST: 'client-maintenance-ticket-type:list',
  CLIENT_MAINTENANCE_TICKET_TYPE_READ: 'client-maintenance-ticket-type:read',
  CLIENT_MAINTENANCE_TICKET_TYPE_UPDATE: 'client-maintenance-ticket-type:update',
  CLIENT_MAINTENANCE_TICKET_TYPE_UPDATE_STATUS: 'client-maintenance-ticket-type:updateStatus',
  CLIENT_MAINTENANCE_TICKET_TYPE_DELETE: 'client-maintenance-ticket-type:delete',

  CLIENT_SYSTEM_TYPE_CREATE: 'client-system-type:create',
  CLIENT_SYSTEM_TYPE_LIST: 'client-system-type:list',
  CLIENT_SYSTEM_TYPE_READ: 'client-system-type:read',
  CLIENT_SYSTEM_TYPE_UPDATE: 'client-system-type:update',
  CLIENT_SYSTEM_TYPE_UPDATE_STATUS: 'client-system-type:updateStatus',
  CLIENT_SYSTEM_TYPE_DELETE: 'client-system-type:delete',

  COMPANY_CREATE: 'company:create',
  COMPANY_LIST: 'company:list',
  COMPANY_READ: 'company:read',
  COMPANY_UPDATE: 'company:update',
  COMPANY_ACTIVATE: 'company:activate',
  COMPANY_DEACTIVATE: 'company:deactivate',

  FAQ_CREATE: 'faq:create',
  FAQ_LIST: 'faq:list',
  FAQ_READ: 'faq:read',
  FAQ_UPDATE: 'faq:update',
  FAQ_UPDATE_STATUS: 'faq:updateStatus',
  FAQ_DELETE: 'faq:delete',

  SERVICE_ATTENDANCE_VALUE_CREATE: 'service-attendance-value:create',
  SERVICE_ATTENDANCE_VALUE_LIST: 'service-attendance-value:list',
  SERVICE_ATTENDANCE_VALUE_READ: 'service-attendance-value:read',
  SERVICE_ATTENDANCE_VALUE_UPDATE: 'service-attendance-value:update',
  SERVICE_ATTENDANCE_VALUE_DELETE: 'service-attendance-value:delete',

  SERVICE_BILLED_CREATE: 'service-billed:create',
  SERVICE_BILLED_LIST: 'service-billed:list',
  SERVICE_BILLED_READ: 'service-billed:read',
  SERVICE_BILLED_UPDATE: 'service-billed:update',
  SERVICE_BILLED_ACTIVATE: 'service-billed:activate',
  SERVICE_BILLED_DEACTIVATE: 'service-billed:deactivate',
  SERVICE_BILLED_DELETE: 'service-billed:delete',

  SERVICE_CATALOG_CREATE: 'service-catalog:create',
  SERVICE_CATALOG_LIST: 'service-catalog:list',
  SERVICE_CATALOG_READ: 'service-catalog:read',
  SERVICE_CATALOG_UPDATE: 'service-catalog:update',
  SERVICE_CATALOG_ACTIVATE: 'service-catalog:activate',
  SERVICE_CATALOG_DEACTIVATE: 'service-catalog:deactivate',
  SERVICE_CATALOG_DELETE: 'service-catalog:delete',

  SERVICE_CATEGORY_CREATE: 'service-category:create',
  SERVICE_CATEGORY_LIST: 'service-category:list',
  SERVICE_CATEGORY_READ: 'service-category:read',
  SERVICE_CATEGORY_UPDATE: 'service-category:update',
  SERVICE_CATEGORY_UPDATE_STATUS: 'service-category:updateStatus',
  SERVICE_CATEGORY_DELETE: 'service-category:delete',

  SERVICE_DELIVERY_TERM_CREATE: 'service-delivery-term:create',
  SERVICE_DELIVERY_TERM_LIST: 'service-delivery-term:list',
  SERVICE_DELIVERY_TERM_READ: 'service-delivery-term:read',
  SERVICE_DELIVERY_TERM_UPDATE: 'service-delivery-term:update',
  SERVICE_DELIVERY_TERM_UPDATE_STATUS: 'service-delivery-term:updateStatus',
  SERVICE_DELIVERY_TERM_DELETE: 'service-delivery-term:delete',

  SERVICE_FREIGHT_CREATE: 'service-freight:create',
  SERVICE_FREIGHT_LIST: 'service-freight:list',
  SERVICE_FREIGHT_READ: 'service-freight:read',
  SERVICE_FREIGHT_UPDATE: 'service-freight:update',
  SERVICE_FREIGHT_UPDATE_STATUS: 'service-freight:updateStatus',
  SERVICE_FREIGHT_DELETE: 'service-freight:delete',

  SERVICE_PROPOSAL_VALIDITY_CREATE: 'service-proposal-validity:create',
  SERVICE_PROPOSAL_VALIDITY_LIST: 'service-proposal-validity:list',
  SERVICE_PROPOSAL_VALIDITY_READ: 'service-proposal-validity:read',
  SERVICE_PROPOSAL_VALIDITY_UPDATE: 'service-proposal-validity:update',
  SERVICE_PROPOSAL_VALIDITY_UPDATE_STATUS: 'service-proposal-validity:updateStatus',
  SERVICE_PROPOSAL_VALIDITY_DELETE: 'service-proposal-validity:delete',

  SERVICE_WARRANTY_CREATE: 'service-warranty:create',
  SERVICE_WARRANTY_LIST: 'service-warranty:list',
  SERVICE_WARRANTY_READ: 'service-warranty:read',
  SERVICE_WARRANTY_UPDATE: 'service-warranty:update',
  SERVICE_WARRANTY_UPDATE_STATUS: 'service-warranty:updateStatus',
  SERVICE_WARRANTY_DELETE: 'service-warranty:delete',

  CNAE_CREATE: 'cnae:create',
  CNAE_LIST: 'cnae:list',
  CNAE_READ: 'cnae:read',
  CNAE_UPDATE: 'cnae:update',
  CNAE_UPDATE_STATUS: 'cnae:updateStatus',
  CNAE_DELETE: 'cnae:delete',

  NBS_CREATE: 'nbs:create',
  NBS_LIST: 'nbs:list',
  NBS_READ: 'nbs:read',
  NBS_UPDATE: 'nbs:update',
  NBS_UPDATE_STATUS: 'nbs:updateStatus',
  NBS_DELETE: 'nbs:delete',

  INDOP_CREATE: 'indop:create',
  INDOP_LIST: 'indop:list',
  INDOP_READ: 'indop:read',
  INDOP_UPDATE: 'indop:update',
  INDOP_UPDATE_STATUS: 'indop:updateStatus',
  INDOP_DELETE: 'indop:delete',

  CNAE_NBS_INDOP_CREATE: 'cnae-nbs-indop:create',
  CNAE_NBS_INDOP_LIST: 'cnae-nbs-indop:list',
  CNAE_NBS_INDOP_LIST_CNAES: 'cnae-nbs-indop:listCnaes',
  CNAE_NBS_INDOP_LIST_NBS: 'cnae-nbs-indop:listNbs',
  CNAE_NBS_INDOP_LIST_INDOPS: 'cnae-nbs-indop:listIndops',
  CNAE_NBS_INDOP_UPDATE_STATUS: 'cnae-nbs-indop:updateStatus',
  CNAE_NBS_INDOP_DELETE: 'cnae-nbs-indop:delete',
} as const;

export type ClaimValue = (typeof Claim)[keyof typeof Claim];

export const ALL_CLAIM_VALUES: readonly ClaimValue[] = Object.values(Claim);

/**
 * Parses a strict `subject:action` claim: exactly one `:` in the string, non-empty parts.
 * Rejects missing colon, multiple colons (e.g. `:client:read`, `cnae:nbs:read:`), empty subject/action.
 */
export function parseClaimString(claim: string): { subject: string; action: string } | null {
  const trimmed = claim.trim();
  const idx = trimmed.indexOf(':');
  if (idx === -1 || idx !== trimmed.lastIndexOf(':')) {
    return null;
  }
  const subject = trimmed.slice(0, idx).trim();
  const action = trimmed.slice(idx + 1).trim();
  if (!subject || !action) {
    return null;
  }
  return { subject, action };
}
