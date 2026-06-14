import { SaveNfmData } from '../../usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';

export interface INfmDao {
  saveMany(rows: SaveNfmData[]): Promise<number>;
}
