import { IsInt, IsPositive } from 'class-validator';

export class SetClientNextIdInputDto {
  @IsInt()
  @IsPositive()
  nextId: number;
}
