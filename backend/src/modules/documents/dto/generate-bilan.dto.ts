import { IsArray, IsNotEmpty, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class GenerateBilanDto {
  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  documentIds: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  periodDays?: number = 90;
}