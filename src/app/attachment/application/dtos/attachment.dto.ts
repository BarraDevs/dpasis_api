export class AttachmentDto {
  id: string;
  name: string | null;
  link: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
