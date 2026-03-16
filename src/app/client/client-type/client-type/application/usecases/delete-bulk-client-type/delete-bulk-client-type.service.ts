import { Injectable } from '@nestjs/common';
import { DeleteClientType } from '../delete-client-type/delete-client-type.service';
import {
  DeleteBulkClientTypeInputDto,
  DeleteBulkClientTypeOutputDto,
} from './dtos/delete-bulk-client-type.dto';

@Injectable()
export class DeleteBulkClientType {
  constructor(
    private readonly deleteClientType: DeleteClientType,
  ) {}

  public async execute(data: DeleteBulkClientTypeInputDto): Promise<DeleteBulkClientTypeOutputDto> {
    const { ids } = data;

    if (ids.length === 0) {
      return { succeeded: [], failed: [] };
    }

    const results = await Promise.allSettled(
      ids.map((id) => this.deleteClientType.execute(id)),
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
