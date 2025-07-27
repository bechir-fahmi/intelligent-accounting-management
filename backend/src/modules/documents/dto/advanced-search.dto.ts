import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '../document-type.enum';

export class AdvancedSearchDto {
  @IsOptional()
  @IsString()
  query?: string; // General text search

  @IsOptional()
  @IsString()
  clientName?: string; // Search by client name

  @IsOptional()
  @IsDateString()
  dateFrom?: string; // Search from date (YYYY-MM-DD)

  @IsOptional()
  @IsDateString()
  dateTo?: string; // Search to date (YYYY-MM-DD)

  @IsOptional()
  @IsDateString()
  exactDate?: string; // Search for exact date (YYYY-MM-DD)

  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType; // Filter by document type

  @IsOptional()
  @IsString()
  filename?: string; // Search by filename

  @IsOptional()
  @IsString()
  description?: string; // Search by description

  @IsOptional()
  @Type(() => Number)
  minSize?: number; // Minimum file size in bytes

  @IsOptional()
  @Type(() => Number)
  maxSize?: number; // Maximum file size in bytes

  @IsOptional()
  @IsString()
  mimeType?: string; // Filter by MIME type (e.g., 'application/pdf')
}

export enum SearchType {
  TEXT = 'text',
  SEMANTIC = 'semantic',
  ADVANCED = 'advanced'
}