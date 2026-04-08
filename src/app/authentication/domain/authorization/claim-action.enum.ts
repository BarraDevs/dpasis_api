export enum ClaimAction {
  // Activate = 'activate',
  // BulkCreate = 'bulkCreate',
  // BulkDelete = 'bulkDelete',
  // Create = 'create',
  // Deactivate = 'deactivate',
  // Delete = 'delete',
  // List = 'list',
  // Detail = 'detail',
  // Update = 'update',
  // UpdateStatus = 'updateStatus',

  // generic actions for v1
  Read = 'read',
  Write = 'write',
}

export const CLAIM_ACTION_LABELS: Record<ClaimAction, string> = {
  [ClaimAction.Read]: 'Leitura',
  [ClaimAction.Write]: 'Escrita',
};
