import { ApiProperty } from '@nestjs/swagger';

export class UploadArrayInputDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  files: File[];
}

export class UploadArrayOutputDto {
  urls: string[];
}
