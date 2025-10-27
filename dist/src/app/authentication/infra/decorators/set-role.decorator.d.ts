import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
export declare const ROLE_KEY = "ROLE";
export declare const SetRoles: (...roles: AccountRole[]) => import("@nestjs/common").CustomDecorator<string>;
