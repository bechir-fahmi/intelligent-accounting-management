import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { DocumentType } from '../document-type.enum';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  size?: number;

  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsString()
  description?: string;
} 