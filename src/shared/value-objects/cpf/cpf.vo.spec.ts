import { InvalidCpfError } from './cpf.error';
import { CPF } from './cpf.vo';

describe('CPF Value Object', () => {
  it.each(
    [
      null,
      undefined,
      '',
      '           ',
      'invalid-cpf',
      '111.111',
      '111.111.111-11',
      '111.111.111.112',
      '012.345.678-00',
      '374.852.529-07',
    ]
  )('should throw an error when providing invalid cpf (%s)', (cpf: string) => {
    expect(() => new CPF(cpf)).toThrow('CPF inválido');
    expect(() => new CPF(cpf)).toThrow(InvalidCpfError);
  });

  it.each(
    [
      '974.563.215-58',
      '714.287.938-60',
      '877.482.488-00',
      '123.456.789-09',
    ]
  )('should create a cpf value object when providing valid cpf (%s)', (cpf: string) => {
    const cpfVo = new CPF(cpf);

    expect(cpfVo).toBeInstanceOf(CPF);
    expect(cpfVo.value).toBe(cpf.replace(/[.-]/g, ''));
  });
});
