import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { DocumentType } from '../document-type.enum';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @IsString()
  filename: string;

  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  @IsString()
  path: string;

  @Type(() => Number)
  @IsNumber()
  size: number;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsString()
  description?: string;
} 