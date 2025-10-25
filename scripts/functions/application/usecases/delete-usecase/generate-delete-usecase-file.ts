import { Props } from 'scripts/generate-module';

export function generateDeleteUsecaseFile({ moduleNamePascal }: Props) {
  return `// import { Injectable } from '@nestjs/common';
// import { SuccessMessage } from 'src/core/dtos/success-message.dto';
//
// @Injectable()
// export class Delete${moduleNamePascal} {
//   constructor() {}
//
//   public async execute(id: string): Promise<SuccessMessage> {
//     return { message: 'Exclusão realizada com sucesso' };
//   }
// }
`;
}
