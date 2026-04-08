import { Injectable } from '@nestjs/common';
import { permissionSubjectCatalog } from 'src/app/admin/application/permission/admin-subject-permission.mapper';
import { PermissionSubjectCatalogItemDto } from '../../dtos/admin-subject-permission.dto';

@Injectable()
export class FindPermissionSubjects {
  public execute(): PermissionSubjectCatalogItemDto[] {
    return permissionSubjectCatalog();
  }
}
