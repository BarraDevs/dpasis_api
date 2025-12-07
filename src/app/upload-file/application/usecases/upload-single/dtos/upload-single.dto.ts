import { ApiProperty } from '@nestjs/swagger';

export class UploadSingleInputDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  file: File;
}

export class UploadSingleOutputDto {
  url: string;
}
