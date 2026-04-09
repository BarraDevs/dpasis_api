import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import {
  claimFromSubjectAction,
  type ClaimValue,
} from 'src/app/authentication/domain/authorization/claim';
import { Document } from 'src/shared/value-objects/document/document.vo';
import { Email } from 'src/shared/value-objects/email/email.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { OptionalString } from 'src/shared/value-objects/optional-string/optional-string.vo';
import { Admin, AdminCreateProps, AdminProps } from '../entities/admin.entity';
import { InvalidAdminClaimsError } from '../errors/invalid-admin-claims.error';

type ClaimInput = {
  subject: string;
  action: string;
};

type AdminFactoryCreateInput = Omit<AdminCreateProps, 'claims'> & {
  claims: ClaimInput[];
};

type AdminFactoryEditInput = Omit<AdminProps, 'claims'> & {
  claims: ClaimInput[];
};

export class AdminFactory {
  private static parseClaimValues(rows: ClaimInput[]): ClaimValue[] {
    const parsed: ClaimValue[] = [];
    for (const row of rows) {
      const c = claimFromSubjectAction(row.subject.trim(), row.action.trim());
      if (c === null) {
        throw new InvalidAdminClaimsError();
      }
      parsed.push(c);
    }
    return parsed;
  }

  private static validateCreateProps(props: AdminCreateProps): AdminCreateProps {
    return {
      document: new Document(props.document).value,
      name: new NonEmptyString(props.name, 'name').value,
      email: new Email(props.email).value,
      profilePicture: new OptionalString(props.profilePicture, 'profilePicture').value,
      claims: props.claims,
    };
  }

  static create(props: AdminFactoryCreateInput): Admin {
    const claims = this.parseClaimValues(props.claims);
    const validatedProps = this.validateCreateProps({
      document: props.document,
      name: props.name,
      email: props.email,
      profilePicture: props.profilePicture,
      claims,
    });

    return Admin._instantiate({
      ...validatedProps,
      accountId: 0,
      status: AccountStatus.ACTIVE,
      canBeRemoved: true, // all admins can be removed (except the first one from seed)
    });
  }

  static edit(props: AdminFactoryEditInput): Admin {
    const claims = this.parseClaimValues(props.claims);
    const validatedProps = this.validateCreateProps({
      document: props.document,
      name: props.name,
      email: props.email,
      profilePicture: props.profilePicture,
      claims,
    });

    return Admin._instantiate({
      ...validatedProps,
      accountId: props.accountId,
      status: props.status,
      canBeRemoved: props.canBeRemoved,
    });
  }

  static load(props: AdminProps): Admin {
    return Admin._instantiate({
      accountId: props.accountId,
      document: props.document,
      name: props.name,
      email: props.email,
      profilePicture: props.profilePicture,
      status: props.status,
      claims: props.claims,
      canBeRemoved: props.canBeRemoved,
    });
  }
}
