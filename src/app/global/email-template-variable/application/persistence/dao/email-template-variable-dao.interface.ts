import { EmailTemplateVariableDto } from '../../dtos/email-template-variable.dto';
import { CreateEmailTemplateVariableInputDto } from '../../usecases/create-email-template-variable/dtos/create-email-template-variable.dto';
import { EditEmailTemplateVariableInputDto } from '../../usecases/edit-email-template-variable/dtos/edit-email-template-variable.dto';
import { FindAllEmailTemplateVariableQueryDto } from '../../usecases/find-all-email-template-variable/dtos/find-all-email-template-variable.dto';

export interface IEmailTemplateVariableDao {
  findAll(queries: FindAllEmailTemplateVariableQueryDto): Promise<[EmailTemplateVariableDto[], number]>;
  findById(id: number): Promise<EmailTemplateVariableDto | null>;
  findByKey(key: string): Promise<EmailTemplateVariableDto | null>;
  findActiveByKeys(keys: string[]): Promise<EmailTemplateVariableDto[]>;
  save(data: CreateEmailTemplateVariableInputDto): Promise<number>;
  edit(id: number, data: EditEmailTemplateVariableInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
