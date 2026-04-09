import { Injectable } from '@nestjs/common';
import { PermissionSubjectCatalogVo } from 'src/app/admin/domain/value-objects/admin-subject-catalog/permission-subject-catalog.vo';
import { PermissionSubjectCatalogItemDto } from '../../dtos/admin-subject-catalog.dto';

@Injectable()
export class FindPermissionSubjects {
  public execute(): PermissionSubjectCatalogItemDto[] {
    return PermissionSubjectCatalogVo.entries();
  }
}
