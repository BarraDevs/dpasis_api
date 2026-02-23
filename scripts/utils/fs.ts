import * as fs from 'fs/promises';
import * as path from 'path';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeGeneratedFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, content, 'utf-8');
}
