import { EditNfmData, NfmPersistedRowDto, SaveNfmData } from '../../usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';

export interface INfmDao {
  findByClientReferenceAndCnae(
    clientId: number,
    referenceMonth: number,
    referenceYear: number,
    cnaeNbsIndopId: number,
  ): Promise<NfmPersistedRowDto | null>;

  save(data: SaveNfmData): Promise<number>;

  edit(id: number, data: EditNfmData): Promise<void>;
}
