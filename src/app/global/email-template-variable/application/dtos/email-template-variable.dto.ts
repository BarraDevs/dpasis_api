export class EmailTemplateVariableDto {
  id: number;
  key: string;
  label: string;
  example: string | null;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
