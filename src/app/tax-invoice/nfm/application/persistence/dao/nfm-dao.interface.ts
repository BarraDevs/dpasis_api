import { NfmWithNfseDto } from '../../dtos/nfm.dto';
import { FindGeneratedNfmsQueryDto } from '../../usecases/find-generated-nfms/dtos/find-generated-nfms.dto';
import { EditNfmData, NfmPersistedRowDto, SaveNfmData } from '../../usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';

export interface INfmDao {
  findAll(queries: FindGeneratedNfmsQueryDto): Promise<[NfmWithNfseDto[], number]>;

  findByClientReferenceAndCnae(
    clientId: number,
    referenceMonth: number,
    referenceYear: number,
    cnaeNbsIndopId: number,
  ): Promise<NfmPersistedRowDto | null>;

  save(data: SaveNfmData): Promise<number>;

  edit(id: number, data: EditNfmData): Promise<void>;
}
