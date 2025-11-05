import { IsNumber, Min } from 'class-validator';

export class DeductStockDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}
