import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateApplicationDtos } from './dtos/generate-dtos';
import { generateApplicationPersistence } from './persistence/generate-persitence';
import { generateApplicationUsecases } from './usecases/generate-usecases';

export async function generateApplicationFiles(props: Props) {
  // Cria a pasta application.
  const applicationPath = path.join(props.modulePath, 'application');
  await fs.mkdir(applicationPath);

  await generateApplicationDtos(props);
  await generateApplicationPersistence(props);
  await generateApplicationUsecases(props);
}
