import * as fs from 'fs/promises';
import * as path from 'path';
import type { Props } from './config';
import { generateModuleFiles } from './generators';
import { kebabToCamelCase, kebabToPascalCase } from './utils/naming';

const args = process.argv.slice(2);
const moduleNameArg = args.find((a) => a !== '--ddd');
if (!moduleNameArg || args.length < 1) {
  console.error('Erro. Uso correto: npx ts-node scripts/cli.ts <nome-do-modulo> [--ddd]');
  process.exit(1);
}

const moduleName = moduleNameArg;
const mode = args.includes('--ddd') ? 'ddd' : 'simple';
const projectRoot = path.join(__dirname, '..');
const modulePath = path.join(projectRoot, 'src', 'app', moduleName);

const props: Props = {
  modulePath,
  moduleName,
  moduleNamePascal: kebabToPascalCase(moduleName),
  moduleNameCamel: kebabToCamelCase(moduleName),
  moduleNameUpper: moduleName.toUpperCase(),
  mode,
};

async function main() {
  try {
    await fs.access(modulePath);
    console.error(`Erro! O módulo "${moduleName}" já existe.`);
    process.exit(1);
  } catch {
    // Módulo não existe, segue o fluxo
  }

  await fs.mkdir(modulePath);
  await generateModuleFiles(props);
  console.log(`Módulo "${moduleName}" criado com sucesso.`);
  console.log('Lembre-se de adicionar os tokens em src/core/di/token.ts:');
  console.log(`  ${props.moduleNamePascal}Dao: Symbol.for('${props.moduleNamePascal}Dao'),`);
  console.log(`  ${props.moduleNamePascal}Repository: Symbol.for('${props.moduleNamePascal}Repository'),`);
  console.log('E adicionar o model no Prisma schema (id, field, status, createdAt, updatedAt).');
}

main().catch((err) => {
  console.error('Erro ao gerar módulo:', err);
  process.exit(1);
});
