import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
export declare function RequiredRoles(...roles: AccountRole[]): <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
