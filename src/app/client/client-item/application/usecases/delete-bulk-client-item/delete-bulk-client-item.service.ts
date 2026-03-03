import { Injectable } from '@nestjs/common';
import { DeleteClientItem } from '../delete-client-item/delete-client-item.service';
import {
  DeleteBulkClientItemInputDto,
  DeleteBulkClientItemOutputDto,
} from './dtos/delete-bulk-client-item.dto';

@Injectable()
export class DeleteBulkClientItem {
  constructor(
    private readonly deleteClientItem: DeleteClientItem,
  ) {}

  public async execute(data: DeleteBulkClientItemInputDto): Promise<DeleteBulkClientItemOutputDto> {
    const { ids } = data;

    if (ids.length === 0) {
      return { succeeded: [], failed: [] };
    }

    const results = await Promise.allSettled(
      ids.map((id) => this.deleteClientItem.execute(id)),
    );

    const succeeded = results
      .map((r, index) => (r.status === 'fulfilled' ? { index, id: ids[index] } : null))
      .filter((x): x is { index: number; id: number } => x !== null);

    const failed = results
      .map((r, index) =>
        r.status === 'rejected'
          ? { index, error: r.reason?.message ?? String(r.reason) }
          : null,
      )
      .filter((x): x is { index: number; error: string } => x !== null);

    return { succeeded, failed };
  }
}
