import { IsInt, IsPositive } from 'class-validator';

export class SetResaleNextIdInputDto {
  @IsInt()
  @IsPositive()
  nextId: number;
}
