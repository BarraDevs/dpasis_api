import { ClientAttachmentDto } from '../../dtos/client-attachment.dto';
import { CreateClientAttachmentInputDto } from '../../usecases/create-client-attachment/dtos/create-client-attachment.dto';
import { EditClientAttachmentInputDto } from '../../usecases/edit-client-attachment/dtos/edit-client-attachment.dto';
import { FindAllClientAttachmentQueryDto } from '../../usecases/find-all-client-attachment/dtos/find-all-client-attachment.dto';

export interface IClientAttachmentDao {
  findAll(queries: FindAllClientAttachmentQueryDto): Promise<[ClientAttachmentDto[], number]>;
  findById(id: number): Promise<ClientAttachmentDto | null>;
  save(data: CreateClientAttachmentInputDto & { link: string }): Promise<number>;
  edit(id: number, data: EditClientAttachmentInputDto & { link?: string }): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
