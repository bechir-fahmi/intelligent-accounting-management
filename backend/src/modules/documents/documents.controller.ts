import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, UploadedFile, UseGuards, Req, Res, StreamableFile, Query, HttpStatus, Redirect, Patch, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ShareDocumentDto } from './dto/share-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request, Response } from 'express';
import { User } from '../users/entities/user.entity';
import { DocumentType } from './document-type.enum';
import { memoryStorage } from 'multer';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage()
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @Req() req: Request & { user: User },
  ) {
    // We now pass the file to the service which will handle uploading to Cloudinary
    const document = await this.documentsService.create(
      {
        ...createDocumentDto,
        type: createDocumentDto.type || DocumentType.OTHER,
      }, 
      req.user,
      file
    );

    return {
      ...document,
      textExcerpt: document.textExcerpt,
      modelPrediction: document.modelPrediction,
      finalPrediction: document.finalPrediction,
      modelConfidence: document.modelConfidence
    };
  }

  @Get()
  async findAll(@Req() req: Request & { user: User }) {
    const documents = await this.documentsService.findAll(req.user);
    
    // Don't return the actual document data in the list
    return documents.map(doc => ({
      id: doc.id,
      originalName: doc.originalName,
      filename: doc.filename,
      type: doc.type,
      size: doc.size,
      mimeType: doc.mimeType,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      description: doc.description,
      isOwner: doc.uploadedBy.id === req.user.id,
      isPublic: doc.isPublic,
      hasSharedUsers: doc.sharedWith && doc.sharedWith.length > 0,
      modelConfidence: doc.modelConfidence,
      modelPrediction: doc.modelPrediction,
      finalPrediction: doc.finalPrediction,
      textExcerpt: doc.textExcerpt
    }));
  }

  @Get('search')
  async searchDocuments(
    @Query('query') query: string,
    @Req() req: Request & { user: User }
  ) {
    if (!query) {
      return { error: 'Search query is required' };
    }
    const documents = await this.documentsService.searchSimilarDocuments(query, req.user);
    
    // Don't return the actual document data in search results
    return documents.map(doc => ({
      id: doc.id,
      originalName: doc.originalName,
      filename: doc.filename,
      type: doc.type,
      size: doc.size,
      mimeType: doc.mimeType,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      description: doc.description,
      isOwner: doc.uploadedBy.id === req.user.id,
      isPublic: doc.isPublic,
      hasSharedUsers: doc.sharedWith && doc.sharedWith.length > 0,
      modelConfidence: doc.modelConfidence,
      modelPrediction: doc.modelPrediction,
      finalPrediction: doc.finalPrediction,
      textExcerpt: doc.textExcerpt
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request & { user: User }) {
    const document = await this.documentsService.findOne(id, req.user);
    
    // Generate a temporary signed URL
    const temporaryUrl = this.documentsService.getTemporaryViewUrl(document, 3600);
    
    return {
      id: document.id,
      originalName: document.originalName,
      filename: document.filename,
      type: document.type,
      size: document.size,
      mimeType: document.mimeType,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      description: document.description,
      temporaryUrl, // Include temporary URL that expires in 1 hour
      isOwner: document.uploadedBy.id === req.user.id,
      isPublic: document.isPublic,
      hasSharedUsers: document.sharedWith && document.sharedWith.length > 0,
      modelConfidence: document.modelConfidence
    };
  }

  @Post(':id/share')
  async shareDocument(
    @Param('id') id: string,
    @Body() shareDocumentDto: ShareDocumentDto,
    @Req() req: Request & { user: User }
  ) {
    const document = await this.documentsService.shareDocument(id, shareDocumentDto, req.user);
    
    return {
      success: true,
      message: 'Document shared successfully',
      sharedWithCount: document.sharedWith.length,
      isPublic: document.isPublic
    };
  }

  @Delete(':id/share/:userId')
  async unshareDocument(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: Request & { user: User }
  ) {
    const document = await this.documentsService.unshareDocument(id, userId, req.user);
    
    return {
      success: true,
      message: 'Document unshared successfully',
      sharedWithCount: document.sharedWith.length
    };
  }

  @Patch(':id/public')
  async setDocumentPublic(
    @Param('id') id: string,
    @Body() body: { isPublic: boolean },
    @Req() req: Request & { user: User }
  ) {
    if (body.isPublic === undefined) {
      return { error: 'isPublic field is required' };
    }
    
    const document = await this.documentsService.setDocumentPublic(id, body.isPublic, req.user);
    
    return {
      success: true,
      message: `Document is now ${body.isPublic ? 'public' : 'private'}`,
      isPublic: document.isPublic
    };
  }

  @Get(':id/shared-users')
  async getSharedUsers(
    @Param('id') id: string,
    @Req() req: Request & { user: User }
  ) {
    const sharedUsers = await this.documentsService.getDocumentSharedUsers(id, req.user);
    
    return sharedUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type
    }));
  }

  @Get(':id/view')
  async viewDocument(
    @Param('id') id: string, 
    @Req() req: Request & { user: User },
    @Res() res: Response
  ) {
    const document = await this.documentsService.findOne(id, req.user);
    
    // Generate a temporary signed URL for viewing
    const temporaryViewUrl = this.documentsService.getTemporaryViewUrl(document, 3600); // 1 hour expiration
    
    if (temporaryViewUrl) {
      return res.redirect(temporaryViewUrl);
    }
    
    // If no URL is available, return an error
    return res.status(HttpStatus.NOT_FOUND).json({
      error: 'Document not found or not available'
    });
  }

  @Get(':id/content')
  async getDocumentContent(@Param('id') id: string, @Req() req: Request & { user: User }) {
    const document = await this.documentsService.findOne(id, req.user);
    
    // Generate a temporary signed URL
    const temporaryUrl = this.documentsService.getTemporaryViewUrl(document, 3600);
    
    // Return basic document info with temporary URL
    return { 
      id: document.id,
      filename: document.originalName,
      type: document.type,
      url: temporaryUrl,
      message: 'Text content extraction is disabled',
      isOwner: document.uploadedBy.id === req.user.id,
      isPublic: document.isPublic
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request & { user: User }) {
    await this.documentsService.remove(id, req.user);
    return { success: true, message: 'Document successfully deleted' };
  }
}