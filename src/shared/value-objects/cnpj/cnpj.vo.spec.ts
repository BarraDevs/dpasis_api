import { InvalidCnpjError } from './cnpj.error';
import { CNPJ } from './cnpj.vo';

describe('CNPJ Value Object', () => {
  it.each(
    [
      null,
      undefined,
      '',
      '           ',
      'invalid-cnpj',
      '11.111.1',
      '11.111.111/0001-112456',
      '11.111.111/0001-11',
      '01.234.567/0008-00',
      '37.485.252/0009-07',
      '11.111.111/1111-11',
      '47.846.258/0001-71',
      'PC3D315K000194',
      'PC3D315K0001A3',
      'PC3D315K00019@',
      '21.SKY.2A5/0001-00',
    ]
  )('should throw an error when providing invalid cnpj (%s)', (cnpj: string) => {
    // Act & Assert
    expect(() => new CNPJ(cnpj)).toThrow('CNPJ inválido');
    expect(() => new CNPJ(cnpj)).toThrow(InvalidCnpjError);
  });

  it.each(
    [
      '09.748.165/0001-10',
      '27.190.423/0001-78',
      '20.293.629/0001-84',
      '53.598.299/0001-94',
      '16.474.222/0001-86',
      'PC3D315K000193',
      'pc3d315k000193',
      '20.SKY.2A5/0001-00',
      '76.EZW.5N4/0001-30',
      'XR.H1E.ZP8/0001-18',
      'LH.GM1.VX8/0001-68',
      'LY.M8A.LEL/0001-00',
    ]
  )('should create a cnpj value object when providing valid cnpj (%s)', (cnpj: string) => {
    // Act
    const cnpjVo = new CNPJ(cnpj);

    // Assert
    expect(cnpjVo).toBeInstanceOf(CNPJ);
    expect(cnpjVo.value).toBe(cnpj.replace(/[/.-]/g, '').toUpperCase());
  });
});
