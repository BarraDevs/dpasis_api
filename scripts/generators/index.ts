import type { Props } from '../config';
import { generateApplication } from './application.generator';
import { generateDomain } from './domain.generator';
import { generateInfra } from './infra.generator';
import { generateModule } from './module.generator';

export async function generateModuleFiles(props: Props): Promise<void> {
  await generateModule(props);
  await generateApplication(props);
  await generateDomain(props);
  await generateInfra(props);
}
