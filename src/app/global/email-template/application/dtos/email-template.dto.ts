export class EmailTemplateDto {
  id: number;
  name: string;
  description: string | null;
  subject: string;
  html: string;
  css: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
