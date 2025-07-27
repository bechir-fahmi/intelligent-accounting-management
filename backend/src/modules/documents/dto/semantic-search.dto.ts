import { IsOptional, IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '../document-type.enum';

export class SemanticSearchDto {
  @IsString()
  query: string; // The search query to find similar documents

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'similarityThreshold must be a number' })
  @Min(0, { message: 'similarityThreshold must be at least 0' })
  @Max(1, { message: 'similarityThreshold must be at most 1' })
  similarityThreshold?: number = 0.1; // Minimum similarity score (0-1)

  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType; // Filter by document type

  @IsOptional()
  @IsString()
  clientName?: string; // Additional filter by client name

  @IsOptional()
  @IsString()
  dateFrom?: string; // Additional filter by date range

  @IsOptional()
  @IsString()
  dateTo?: string; // Additional filter by date range

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxResults?: number = 50; // Maximum number of results to return
}

export interface SemanticSearchResult {
  document: any;
  similarity: number;
  rank: number;
}