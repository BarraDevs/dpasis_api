export type ModuleMode = 'simple' | 'ddd';

export type Props = {
  modulePath: string;
  moduleName: string;
  moduleNamePascal: string;
  moduleNameCamel: string;
  moduleNameUpper: string;
  mode: ModuleMode;
};
