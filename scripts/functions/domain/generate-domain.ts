import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';

export async function generateDomainFiles({ modulePath }: Props) {
  // Cria a pasta domain.
  const domainPath = path.join(modulePath, 'domain');
  await fs.mkdir(domainPath);

  // Vazia por enquanto.
  await fs.writeFile(path.join(domainPath, '.gitkeep'), '');
}
