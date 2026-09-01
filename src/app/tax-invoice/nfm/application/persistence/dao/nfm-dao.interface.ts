import { NfmDaoRowDto, NfmWithNfseDto } from '../../dtos/nfm.dto';
import { FindGeneratedNfmsQueryDto } from '../../usecases/find-generated-nfms/dtos/find-generated-nfms.dto';

export interface INfmDao {
  findAll(queries: FindGeneratedNfmsQueryDto): Promise<[NfmWithNfseDto[], number]>;
  findById(id: number): Promise<NfmDaoRowDto | null>;
}
