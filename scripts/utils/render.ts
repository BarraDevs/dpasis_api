import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as path from 'path';

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

export function renderTemplate(templateRelativePath: string, context: Record<string, unknown>): string {
  const templatePath = path.join(TEMPLATES_DIR, templateRelativePath);
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  return template(context);
}
