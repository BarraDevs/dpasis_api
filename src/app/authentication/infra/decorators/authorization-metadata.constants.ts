/**
 * Chaves de metadata do NestJS (`Reflector`) para autorização CASL.
 * Mantidas num único arquivo para evitar dependência circular entre guards e decorators compostos.
 */
export const REQUIRED_ROLES_KEY = 'required_roles';
export const REQUIRED_CLAIMS_KEY = 'required_claims';
