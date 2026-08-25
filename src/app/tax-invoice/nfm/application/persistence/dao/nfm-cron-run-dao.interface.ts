import { SaveElegibleNfmsOutputDto } from '../../usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';

export interface INfmCronRunDao {
  save(data: SaveElegibleNfmsOutputDto): Promise<number>;
}
