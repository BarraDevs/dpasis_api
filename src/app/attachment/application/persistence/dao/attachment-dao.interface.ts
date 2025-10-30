import { AttachmentDto } from '../../dtos/attachment.dto';
import { CreateAttachmentInputDto } from '../../usecases/create-attachment/dtos/create-attachment.dto';
import { EditAttachmentInputDto } from '../../usecases/edit-attachment/dtos/edit-attachment.dto';
import { FindAllAttachmentQueryDto } from '../../usecases/find-all-attachment/dtos/find-all-attachment.dto';

export interface IAttachmentDao {
  findAll(queries: FindAllAttachmentQueryDto): Promise<[AttachmentDto[], number]>;
  findById(id: string): Promise<AttachmentDto | null>;
  save(data: CreateAttachmentInputDto): Promise<string>;
  edit(id: string, data: EditAttachmentInputDto): Promise<void>;
  delete(id: string): Promise<void>;
}
