import { AlertType } from '../../enums/alert-type.enum';
import { AlertFakeAdapterGateway } from './alert-fake.gateway';

describe('AlertFakeAdapterGateway - Unit tests', () => {
  let sut: AlertFakeAdapterGateway;

  beforeEach(() => {
    sut = new AlertFakeAdapterGateway();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should record every alert it is asked to send', async() => {
    // Act
    await sut.send({ type: AlertType.NfseStuck, subject: 'assunto', lines: ['linha'] });

    // Assert
    expect(sut.sentAlerts).toEqual([
      { type: AlertType.NfseStuck, subject: 'assunto', lines: ['linha'] },
    ]);
  });
});
