import { AppException } from 'src/core/filters/app.exception';

export class NfmNfseMissingError extends AppException {
  constructor(nfmId: number) {
    super(`NFM ${nfmId} sem NFS-e vinculada.`, 500);
    this.name = 'NfmNfseMissingError';
  }
}
