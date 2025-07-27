import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SimpleSearchDto {
  @IsOptional()
  @IsString()
  clientName?: string; // Search by client name using embeddings

  @IsOptional()
  @IsString()
  date?: string; // Search by date - supports year only (e.g., "2025") or full date (e.g., "2025-01-15")

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  similarityThreshold?: number = 0.3; // Minimum similarity score

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  exactClientMatch?: boolean = false; // Whether to enforce exact client name matching

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10; // Results limit
}