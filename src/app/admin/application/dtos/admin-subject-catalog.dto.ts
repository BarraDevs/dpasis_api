import { ApiProperty } from '@nestjs/swagger';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';

export class PermissionSubjectCatalogItemDto {
  @ApiProperty({ enum: ClaimSubject })
  subject: ClaimSubject;

  @ApiProperty()
  label: string;
}
