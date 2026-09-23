import { EmailTemplateDto } from '../../dtos/email-template.dto';
import { CreateEmailTemplateInputDto } from '../../usecases/create-email-template/dtos/create-email-template.dto';
import { EditEmailTemplateInputDto } from '../../usecases/edit-email-template/dtos/edit-email-template.dto';
import { FindAllEmailTemplateQueryDto } from '../../usecases/find-all-email-template/dtos/find-all-email-template.dto';

export interface IEmailTemplateDao {
  findAll(queries: FindAllEmailTemplateQueryDto): Promise<[EmailTemplateDto[], number]>;
  findById(id: number): Promise<EmailTemplateDto | null>;
  findByName(name: string): Promise<EmailTemplateDto | null>;
  save(data: CreateEmailTemplateInputDto): Promise<number>;
  edit(id: number, data: EditEmailTemplateInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
