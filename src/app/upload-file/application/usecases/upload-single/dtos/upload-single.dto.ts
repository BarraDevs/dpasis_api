import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadSingleInputDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  file: File;
}

export class UploadSingleOutputDto {
  url: string;
}
