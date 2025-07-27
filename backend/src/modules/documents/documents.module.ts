import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Document } from './entities/document.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { User } from '../users/entities/user.entity';
import { EmbeddingService } from './services/embedding.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, User]),
    CloudinaryModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, EmbeddingService],
  exports: [DocumentsService, EmbeddingService],
})
export class DocumentsModule {} 