import { Injectable } from '@nestjs/common';
import { CreateClientItem } from '../create-client-item/create-client-item.service';
import {
  CreateBulkClientItemInputDto,
  CreateBulkClientItemOutputDto,
} from './dtos/create-bulk-client-item.dto';

@Injectable()
export class CreateBulkClientItem {
  constructor(
    private readonly createClientItem: CreateClientItem,
  ) {}

  public async execute(data: CreateBulkClientItemInputDto): Promise<CreateBulkClientItemOutputDto> {
    const { items } = data;

    if (items.length === 0) {
      return { succeeded: [], failed: [] };
    }

    const results = await Promise.allSettled(
      items.map((item) => this.createClientItem.execute(item)),
    );

    const succeeded = results
      .map((r, index) => (r.status === 'fulfilled' ? { index, id: r.value.id } : null))
      .filter((x): x is { index: number; id: number } => x !== null);

    const failed = results
      .map((r, index) => (r.status === 'rejected' ? { index, error: r.reason?.message ?? String(r.reason) } : null))
      .filter((x): x is { index: number; error: string } => x !== null);

    return { succeeded, failed };
  }
}
