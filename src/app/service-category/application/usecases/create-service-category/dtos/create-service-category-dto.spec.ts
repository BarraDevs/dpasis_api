import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateServiceCategoryInputDto } from './create-service-category.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateServiceCategoryInputDto,
};

describe('CreateServiceCategoryInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('name field (required)', () => {
    describe('validation errors', () => {
      it.each([undefined, null, '', '  '])(
        'should throw an error if name is empty (%s)',
        async(value: any) => {
          // Arrange
          const data = { name: value };

          // Act & Assert
          expect.assertions(1);
          await target.transform(data, metadata).catch((error) => {
            expect(error.getResponse().message).toContain('name é obrigatório');
          });
        },
      );

      it.each([
        123,
        456.78,
        true,
        false,
        {},
        [],
        ['array'],
      ])('should throw an error if name is not a string (%s)', async(value: any) => {
        // Arrange
        const data = { name: value };

        // Act & Assert
        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('name deve ser um texto');
        });
      });

      it('should throw an error if name exceeds maximum length (256)', async() => {
        // Arrange
        const longString = 'a'.repeat(257);
        const data = { name: longString };

        // Act & Assert
        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('name deve ter no máximo 256 caracteres');
        });
      });

      it('should throw an error if name is only whitespace after trim', async() => {
        // Arrange
        const data = { name: '     ' };

        // Act & Assert
        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('name é obrigatório');
        });
      });

      it('should throw an error if name contains only tabs', async() => {
        // Arrange
        const data = { name: '\t\t\t' };

        // Act & Assert
        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('name é obrigatório');
        });
      });

      it('should throw an error if name contains only newlines', async() => {
        // Arrange
        const data = { name: '\n\n\n' };

        // Act & Assert
        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('name é obrigatório');
        });
      });
    });

    describe('valid values', () => {
      it('should accept valid name with minimum length (1 char)', async() => {
        // Arrange
        const data = { name: 'A' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result).toBeInstanceOf(CreateServiceCategoryInputDto);
        expect(result.name).toBe('A');
      });

      it('should accept valid name with maximum length (256 chars)', async() => {
        // Arrange
        const maxLengthName = 'a'.repeat(256);
        const data = { name: maxLengthName };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result).toBeInstanceOf(CreateServiceCategoryInputDto);
        expect(result.name).toBe(maxLengthName);
        expect(result.name.length).toBe(256);
      });

      it('should accept name with typical length', async() => {
        // Arrange
        const data = { name: 'Manutenção Preventiva' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result).toBeInstanceOf(CreateServiceCategoryInputDto);
        expect(result.name).toBe(data.name);
      });

      it('should trim whitespace from name', async() => {
        // Arrange
        const data = { name: '  Instalação  ' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Instalação');
      });

      it('should trim leading whitespace', async() => {
        // Arrange
        const data = { name: '     Consultoria' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Consultoria');
      });

      it('should trim trailing whitespace', async() => {
        // Arrange
        const data = { name: 'Suporte     ' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Suporte');
      });

      it('should trim tabs from name', async() => {
        // Arrange
        const data = { name: '\t\tManutenção\t\t' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Manutenção');
      });

      it('should trim newlines from name', async() => {
        // Arrange
        const data = { name: '\nInstalação\n' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Instalação');
      });

      it('should preserve internal spaces', async() => {
        // Arrange
        const data = { name: 'Manutenção Preventiva e Corretiva' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Manutenção Preventiva e Corretiva');
      });

      it('should preserve multiple internal spaces', async() => {
        // Arrange
        const data = { name: 'Categoria    com    espaços' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Categoria    com    espaços');
      });
    });

    describe('special characters', () => {
      it('should accept name with accents', async() => {
        // Arrange
        const data = { name: 'Instalação Elétrica' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Instalação Elétrica');
      });

      it('should accept name with various accents', async() => {
        // Arrange
        const data = { name: 'Ação técnica ávançádá' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Ação técnica ávançádá');
      });

      it('should accept name with cedilla', async() => {
        // Arrange
        const data = { name: 'Manutenção básica' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Manutenção básica');
      });

      it('should accept name with hyphens', async() => {
        // Arrange
        const data = { name: 'Serviço-Categoria-01' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Serviço-Categoria-01');
      });

      it('should accept name with underscores', async() => {
        // Arrange
        const data = { name: 'Categoria_de_Serviço' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Categoria_de_Serviço');
      });

      it('should accept name with numbers', async() => {
        // Arrange
        const data = { name: 'Manutenção Nível 1' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Manutenção Nível 1');
      });

      it('should accept name with ampersand', async() => {
        // Arrange
        const data = { name: 'Instalação & Manutenção' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Instalação & Manutenção');
      });

      it('should accept name with parentheses', async() => {
        // Arrange
        const data = { name: 'Consultoria (Técnica)' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Consultoria (Técnica)');
      });

      it('should accept name with slashes', async() => {
        // Arrange
        const data = { name: 'Instalação/Manutenção' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Instalação/Manutenção');
      });

      it('should accept name with dots', async() => {
        // Arrange
        const data = { name: 'Serviço A.B.C.' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Serviço A.B.C.');
      });

      it('should accept name with commas', async() => {
        // Arrange
        const data = { name: 'Instalação, Manutenção e Consultoria' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Instalação, Manutenção e Consultoria');
      });

      it('should accept name with exclamation mark', async() => {
        // Arrange
        const data = { name: 'Serviço Premium!' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Serviço Premium!');
      });

      it('should accept name with question mark', async() => {
        // Arrange
        const data = { name: 'Precisa de ajuda?' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Precisa de ajuda?');
      });

      it('should accept name with emojis', async() => {
        // Arrange
        const data = { name: 'Consultoria 💡' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Consultoria 💡');
      });

      it('should accept name with multiple emojis', async() => {
        // Arrange
        const data = { name: '⚡ Instalação Rápida 🔧' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('⚡ Instalação Rápida 🔧');
      });

      it('should accept name with symbols', async() => {
        // Arrange
        const data = { name: 'Categoria @ 2025' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Categoria @ 2025');
      });
    });

    describe('case sensitivity', () => {
      it('should preserve uppercase', async() => {
        // Arrange
        const data = { name: 'MANUTENÇÃO' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('MANUTENÇÃO');
      });

      it('should preserve lowercase', async() => {
        // Arrange
        const data = { name: 'manutenção' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('manutenção');
      });

      it('should preserve mixed case', async() => {
        // Arrange
        const data = { name: 'MaNuTeNçÃo' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('MaNuTeNçÃo');
      });

      it('should preserve Title Case', async() => {
        // Arrange
        const data = { name: 'Manutenção Preventiva' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Manutenção Preventiva');
      });
    });

    describe('real-world scenarios', () => {
      it.each([
        'Manutenção',
        'Instalação',
        'Consultoria',
        'Suporte Técnico',
        'Treinamento',
        'Reparo',
        'Diagnóstico',
        'Monitoramento',
        'Upgrade',
        'Configuração',
      ])('should accept common service category names: %s', async(name: string) => {
        // Arrange
        const data = { name };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe(name);
      });

      it.each([
        'Manutenção Preventiva',
        'Manutenção Corretiva',
        'Instalação Elétrica',
        'Instalação Hidráulica',
        'Consultoria Técnica',
        'Consultoria de TI',
        'Suporte Remoto',
        'Suporte Presencial',
        'Treinamento Online',
        'Treinamento In-loco',
      ])('should accept detailed service category names: %s', async(name: string) => {
        // Arrange
        const data = { name };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe(name);
      });
    });

    describe('edge cases', () => {
      it('should accept name with single character', async() => {
        // Arrange
        const data = { name: 'X' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('X');
      });

      it('should accept name with two characters', async() => {
        // Arrange
        const data = { name: 'AB' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('AB');
      });

      it('should accept name that is exactly 255 characters', async() => {
        // Arrange
        const name = 'a'.repeat(255);
        const data = { name };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe(name);
        expect(result.name.length).toBe(255);
      });

      it('should handle name with mixed whitespace at edges', async() => {
        // Arrange
        const data = { name: ' \t \n Serviço \n \t ' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Serviço');
      });

      it('should handle unicode characters', async() => {
        // Arrange
        const data = { name: 'Serviço 中文 日本語' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('Serviço 中文 日本語');
      });

      it('should handle name with only numbers', async() => {
        // Arrange
        const data = { name: '12345' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('12345');
      });

      it('should handle name with leading numbers', async() => {
        // Arrange
        const data = { name: '01 - Manutenção' };

        // Act
        const result = await target.transform(data, metadata);

        // Assert
        expect(result.name).toBe('01 - Manutenção');
      });
    });
  });

  describe('complete dto validation', () => {
    it('should pass if all fields are valid', async() => {
      // Arrange
      const data: CreateServiceCategoryInputDto = {
        name: 'Manutenção Preventiva',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CreateServiceCategoryInputDto);
      expect(result).toEqual(data);
    });

    it('should pass and trim when name has whitespace', async() => {
      // Arrange
      const data = {
        name: '  Consultoria Técnica  ',
      };
      const expected = {
        name: 'Consultoria Técnica',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toEqual(expected);
    });

    it('should reject when name is missing', async() => {
      // Arrange
      const data = {};

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name é obrigatório');
      });
    });

    it('should reject extra unknown fields (with pipeOptions)', async() => {
      // Arrange
      const data = {
        name: 'Valid Name',
        extraField: 'should be removed',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CreateServiceCategoryInputDto);
      expect(result.name).toBe('Valid Name');
      expect((result as any).extraField).toBeUndefined();
    });
  });
});
