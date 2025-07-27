import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SmartSearchDto {
  @IsOptional()
  @IsString()
  clientName?: string; // Search by exact client name

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number; // Search by year (e.g., 2025)

  @IsOptional()
  @IsString()
  query?: string; // Optional general text search

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10; // Results limit
}

export interface SmartSearchResult {
  document: any;
  matchType: 'client_name' | 'year' | 'text' | 'multiple';
  matchDetails: string;
}