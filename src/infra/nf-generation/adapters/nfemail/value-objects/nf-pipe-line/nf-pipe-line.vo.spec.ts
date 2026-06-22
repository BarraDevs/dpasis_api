import { NfPipeLine } from './nf-pipe-line.vo';

describe('NfPipeLine - Unit tests', () => {
  it('should be defined', () => {
    expect(NfPipeLine).toBeDefined();
  });

  it('should build pipe line ending with pipe and newline', () => {
    // Act
    const result = NfPipeLine.create('UB12', '000', '000001', '', '1.00');

    // Assert
    expect(result.value).toBe('UB12|000|000001||1.00|\n');
  });

  it('should build group-only line with trailing pipe by default', () => {
    // Act
    const result = NfPipeLine.createGroupOnly('UB');

    // Assert
    expect(result.value).toBe('UB|\n');
  });

  it('should build group-only line without trailing pipe when disabled', () => {
    // Act
    const result = NfPipeLine.createGroupOnly('YA', false);

    // Assert
    expect(result.value).toBe('YA\n');
  });
});
