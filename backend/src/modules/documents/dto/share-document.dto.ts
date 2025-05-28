import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class ShareDocumentDto {
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublic?: boolean;
} 