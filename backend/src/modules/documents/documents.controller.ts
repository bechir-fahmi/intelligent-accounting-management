import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, UploadedFile, UseGuards, Req, Res, StreamableFile, Query, HttpStatus, Redirect, Patch, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ShareDocumentDto } from './dto/share-document.dto';
import { PaginationDto } from './dto/pagination.dto';
import { AdvancedSearchDto } from './dto/advanced-search.dto';
import { SemanticSearchDto } from './dto/semantic-search.dto';
import { SmartSearchDto } from './dto/smart-search.dto';
import { SimpleSearchDto } from './dto/simple-search.dto';
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
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Req() req: Request & { user: User }
  ) {
    const result = await this.documentsService.findAll(req.user, paginationDto);
    
    // Transform the documents data
    const transformedData = result.data.map(doc => ({
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
    
    return {
      data: transformedData,
      pagination: result.pagination
    };
  }

  @Get('search')
  async searchDocuments(
    @Query('query') query: string,
    @Query() paginationDto: PaginationDto,
    @Req() req: Request & { user: User }
  ) {
    if (!query) {
      return { error: 'Search query is required' };
    }
    
    const result = await this.documentsService.searchSimilarDocuments(query, req.user, paginationDto);
    
    // Transform the documents data
    const transformedData = result.data.map(doc => ({
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
    
    return {
      data: transformedData,
      pagination: result.pagination
    };
  }

  @Get('advanced-search')
  async advancedSearch(
    @Query() searchDto: AdvancedSearchDto,
    @Query() paginationDto: PaginationDto,
    @Req() req: Request & { user: User }
  ) {
    const result = await this.documentsService.advancedSearch(searchDto, req.user, paginationDto);
    
    // Transform the documents data
    const transformedData = result.data.map(doc => ({
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
      textExcerpt: doc.textExcerpt,
      extractedInfo: doc.extractedInfo // Include extracted info in response
    }));
    
    return {
      data: transformedData,
      pagination: result.pagination,
      searchCriteria: searchDto // Include search criteria in response for reference
    };
  }

  @Get('semantic-search-debug')
  async semanticSearchDebug(@Query() query: any, @Req() req: Request & { user: User }) {
    return {
      message: 'Debug endpoint working',
      queryReceived: query,
      user: req.user?.id,
      timestamp: new Date().toISOString()
    };
  }

  @Get('semantic-search')
  async semanticSearch(
    @Query() allParams: any,
    @Req() req: Request & { user: User }
  ) {
    try {
      // Debug logging
      console.log('🔍 Semantic Search Debug:');
      console.log('All query params received:', allParams);
      console.log('User:', req.user?.id);

      // Manually extract and validate parameters
      const searchDto: SemanticSearchDto = {
        query: allParams.query,
        similarityThreshold: allParams.similarityThreshold ? parseFloat(allParams.similarityThreshold) : 0.1,
        documentType: allParams.documentType,
        clientName: allParams.clientName,
        dateFrom: allParams.dateFrom,
        dateTo: allParams.dateTo,
        maxResults: allParams.maxResults ? parseInt(allParams.maxResults) : 50
      };

      const paginationDto: PaginationDto = {
        page: allParams.page ? parseInt(allParams.page) : 1,
        limit: allParams.limit ? parseInt(allParams.limit) : 10,
        sortBy: allParams.sortBy || 'createdAt',
        sortOrder: allParams.sortOrder || 'DESC'
      };

      console.log('Parsed searchDto:', searchDto);
      console.log('Parsed paginationDto:', paginationDto);

      if (!searchDto.query) {
        return { error: 'Search query is required for semantic search' };
      }

      const result = await this.documentsService.semanticSearch(searchDto, req.user, paginationDto);
      
      // Transform the results to include similarity scores
      const transformedData = result.data.map(item => ({
        ...this.transformDocument(item.document, req.user.id),
        similarity: item.similarity,
        rank: item.rank
      }));
      
      return {
        data: transformedData,
        pagination: result.pagination,
        searchCriteria: searchDto,
        searchType: 'semantic'
      };
    } catch (error) {
      console.error('❌ Semantic search error:', error);
      throw error;
    }
  }

  @Get('hybrid-search')
  async hybridSearch(
    @Query() allParams: any,
    @Req() req: Request & { user: User }
  ) {
    try {
      // Manually extract and validate parameters
      const searchDto: SemanticSearchDto = {
        query: allParams.query,
        similarityThreshold: allParams.similarityThreshold ? parseFloat(allParams.similarityThreshold) : 0.1,
        documentType: allParams.documentType,
        clientName: allParams.clientName,
        dateFrom: allParams.dateFrom,
        dateTo: allParams.dateTo,
        maxResults: allParams.maxResults ? parseInt(allParams.maxResults) : 50
      };

      const paginationDto: PaginationDto = {
        page: allParams.page ? parseInt(allParams.page) : 1,
        limit: allParams.limit ? parseInt(allParams.limit) : 10,
        sortBy: allParams.sortBy || 'createdAt',
        sortOrder: allParams.sortOrder || 'DESC'
      };

      if (!searchDto.query) {
        return { error: 'Search query is required for hybrid search' };
      }

      const result = await this.documentsService.hybridSearch(searchDto, req.user, paginationDto);
      
      // Transform the results to include similarity scores
      const transformedData = result.data.map(item => ({
        ...this.transformDocument(item.document, req.user.id),
        similarity: item.similarity,
        rank: item.rank
      }));
      
      return {
        data: transformedData,
        pagination: result.pagination,
        searchCriteria: searchDto,
        searchType: 'hybrid'
      };
    } catch (error) {
      console.error('❌ Hybrid search error:', error);
      throw error;
    }
  }

  @Get('smart-search')
  async smartSearch(
    @Query() allParams: any,
    @Req() req: Request & { user: User }
  ) {
    try {
      // Parse parameters
      const searchDto: SmartSearchDto = {
        clientName: allParams.clientName,
        year: allParams.year ? parseInt(allParams.year) : undefined,
        query: allParams.query,
        limit: allParams.limit ? parseInt(allParams.limit) : 10
      };

      const paginationDto: PaginationDto = {
        page: allParams.page ? parseInt(allParams.page) : 1,
        limit: allParams.limit ? parseInt(allParams.limit) : 10,
        sortBy: allParams.sortBy || 'createdAt',
        sortOrder: allParams.sortOrder || 'DESC'
      };

      console.log('🎯 Smart search params:', searchDto);

      const result = await this.documentsService.smartSearch(searchDto, req.user, paginationDto);
      
      // Transform the results
      const transformedData = result.data.map(item => ({
        ...this.transformDocument(item.document, req.user.id),
        matchType: item.matchType,
        matchDetails: item.matchDetails
      }));
      
      return {
        data: transformedData,
        pagination: result.pagination,
        searchCriteria: searchDto,
        searchType: 'smart'
      };
    } catch (error) {
      console.error('❌ Smart search error:', error);
      throw error;
    }
  }

  @Get('simple-search')
  async simpleSearch(
    @Query() allParams: any,
    @Req() req: Request & { user: User }
  ) {
    try {
      // Parse parameters
      const searchDto: SimpleSearchDto = {
        clientName: allParams.clientName?.trim(),
        date: allParams.date?.trim(),
        similarityThreshold: allParams.similarityThreshold ? parseFloat(allParams.similarityThreshold) : 0.3,
        exactClientMatch: allParams.exactClientMatch === 'true' || allParams.exactClientMatch === true,
        limit: allParams.limit ? parseInt(allParams.limit) : 10
      };

      const paginationDto: PaginationDto = {
        page: allParams.page ? parseInt(allParams.page) : 1,
        limit: allParams.limit ? parseInt(allParams.limit) : 10,
        sortBy: 'similarity',
        sortOrder: 'DESC'
      };

      console.log('🔍 Simple search params:', searchDto);

      const result = await this.documentsService.simpleSemanticSearch(searchDto, req.user, paginationDto);
      
      // Transform the results
      const transformedData = result.data.map(item => ({
        ...this.transformDocument(item.document, req.user.id),
        similarity: item.similarity,
        rank: item.rank
      }));
      
      return {
        data: transformedData,
        pagination: result.pagination,
        searchCriteria: searchDto,
        searchType: 'simple-semantic'
      };
    } catch (error) {
      console.error('❌ Simple search error:', error);
      throw error;
    }
  }

  // Helper method to transform document data
  private transformDocument(doc: any, userId: string) {
    return {
      id: doc.id,
      originalName: doc.originalName,
      filename: doc.filename,
      type: doc.type,
      size: doc.size,
      mimeType: doc.mimeType,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      description: doc.description,
      isOwner: doc.uploadedBy.id === userId,
      isPublic: doc.isPublic,
      hasSharedUsers: doc.sharedWith && doc.sharedWith.length > 0,
      modelConfidence: doc.modelConfidence,
      modelPrediction: doc.modelPrediction,
      finalPrediction: doc.finalPrediction,
      textExcerpt: doc.textExcerpt,
      extractedInfo: doc.extractedInfo
    };
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