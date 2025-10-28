import { ContactDto } from '../../dtos/contact.dto';
import { CreateContactInputDto } from '../../usecases/create-contact/dtos/create-contact.dto';
import { EditContactInputDto } from '../../usecases/edit-contact/dtos/edit-contact.dto';
import { FindAllContactQueryDto } from '../../usecases/find-all-contact/dtos/find-all-contact.dto';

export interface IContactDao {
  findAll(queries: FindAllContactQueryDto): Promise<[ContactDto[], number]>;
  findById(id: string): Promise<ContactDto | null>;
  save(data: CreateContactInputDto): Promise<string>;
  edit(id: string, data: EditContactInputDto): Promise<void>;
  delete(id: string): Promise<void>;
}
