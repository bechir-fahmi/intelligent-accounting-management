import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ShareDocumentDto } from './dto/share-document.dto';
import { PaginationDto, PaginatedResult } from './dto/pagination.dto';
import { AdvancedSearchDto } from './dto/advanced-search.dto';
import { SemanticSearchDto, SemanticSearchResult } from './dto/semantic-search.dto';
import { SmartSearchDto, SmartSearchResult } from './dto/smart-search.dto';
import { SimpleSearchDto } from './dto/simple-search.dto';
import { EmbeddingService } from './services/embedding.service';
import { User } from '../users/entities/user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import * as path from 'path';
import axios from 'axios';
import { DocumentType } from './document-type.enum';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cloudinaryService: CloudinaryService,
    private embeddingService: EmbeddingService,
  ) { }

  async create(createDocumentDto: CreateDocumentDto, user: User, file: Express.Multer.File): Promise<Document> {
    try {
      // Generate a unique ID for the file
      const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;

      // Upload directly to Cloudinary from memory with private type
      const cloudinaryResult = await this.cloudinaryService.uploadFile(
        file.buffer,
        {
          folder: `documents/${user.id}`,
          public_id: path.parse(file.originalname).name + '-' + uniqueId,
          resource_type: 'auto',
          type: 'private', // Ensure it's private
        }
      );

      // Call AI model API for classification
      let modelPrediction = null;
      let finalPrediction = null;
      let modelConfidence = null;
      let textExcerpt = null;
      let documentEmbedding = null;
      let extractedInfo = null;
      let aiRawResponse = null;
      // Default to OTHER
      let detectedType: DocumentType = DocumentType.OTHER;
      try {
        const formData = new (require('form-data'))();
        formData.append('file', file.buffer, file.originalname);
        const response = await axios.post('http://localhost:8000/classify', formData, {
          headers: formData.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });
        if (response.data) {
          aiRawResponse = response.data;
          modelPrediction = response.data.model_prediction || response.data.prediction || null;
          finalPrediction = response.data.final_prediction || null;
          modelConfidence = response.data.model_confidence || response.data.confidence || null;
          textExcerpt = response.data.text_excerpt || null;
          documentEmbedding = response.data.document_embedding || null;
          extractedInfo = response.data.extracted_info || null;

          // Map finalPrediction to DocumentType if valid
          if (finalPrediction && Object.values(DocumentType).includes(finalPrediction)) {
            detectedType = finalPrediction as DocumentType;
          } else if (modelPrediction && Object.values(DocumentType).includes(modelPrediction)) {
            detectedType = modelPrediction as DocumentType;
          } else if (createDocumentDto.type && Object.values(DocumentType).includes(createDocumentDto.type)) {
            detectedType = createDocumentDto.type;
          } else {
            detectedType = DocumentType.OTHER;
          }
        }
      } catch (err) {
        console.error('Error calling AI model API:', err.message);
      }
      // Create document entity
      console.log('📝 Creating document entity...');
      console.log('- File info:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      console.log('- AI results:', {
        modelPrediction,
        finalPrediction,
        modelConfidence,
        textExcerptLength: textExcerpt?.length || 0,
        embeddingLength: documentEmbedding?.length || 0,
        extractedInfo
      });

      const document = this.documentsRepository.create({
        ...createDocumentDto,
        uploadedBy: user,
        originalName: file.originalname,
        filename: file.originalname, // Use original name since we don't generate a local filename
        mimeType: file.mimetype,
        size: file.size,
        cloudinaryPublicId: cloudinaryResult.public_id,
        cloudinaryUrl: cloudinaryResult.url,
        cloudinarySecureUrl: cloudinaryResult.secure_url,
        cloudinaryVersion: cloudinaryResult.version.toString(),
        cloudinaryFormat: cloudinaryResult.format,
        cloudinaryMetadata: cloudinaryResult,
        isProcessed: true, // Mark as processed immediately since we're not doing embeddings
        sharedWith: [], // Initialize empty shared users array
        isPublic: false, // Default to private
        modelPrediction,
        finalPrediction,
        modelConfidence,
        textExcerpt,
        embedding: null, // Temporarily disable embedding save to debug hanging issue
        extractedInfo, // Save extracted information
        type: detectedType,
        // Remove aiRawResponse from entity, but log it for debugging
      });

      console.log('✅ Document entity created successfully');
      if (aiRawResponse) {
        console.log('✅ AI Model API processing completed successfully');
      }

      console.log('💾 Attempting to save document to database...');

      try {
        const savedDocument = await this.documentsRepository.save(document);
        console.log('✅ Document saved successfully with ID:', savedDocument.id);
        return savedDocument;
      } catch (saveError) {
        console.error('❌ Error saving document to database:', saveError);
        throw saveError;
      }
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async findAll(user: User, paginationDto?: PaginationDto): Promise<PaginatedResult<Document>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = paginationDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build the query
    const queryBuilder = this.documentsRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.uploadedBy', 'uploader')
      .leftJoinAndSelect('document.sharedWith', 'sharedUser')
      .where([
        { uploadedBy: { id: user.id } }, // Documents uploaded by the user
        { isPublic: true }, // Public documents
      ])
      .orWhere('sharedUser.id = :userId', { userId: user.id }); // Documents shared with the user

    // Add sorting
    const validSortFields = ['createdAt', 'updatedAt', 'originalName', 'size', 'type'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`document.${sortField}`, sortOrder);

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const documents = await queryBuilder
      .skip(offset)
      .take(limit)
      .getMany();

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  // Keep the old method for backward compatibility
  async findAllLegacy(user: User): Promise<Document[]> {
    const result = await this.findAll(user);
    return result.data;
  }

  async findOne(id: string, user: User): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['uploadedBy', 'sharedWith'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Check if user has access to the document
    const isOwner = document.uploadedBy.id === user.id;
    const isSharedWithUser = document.sharedWith?.some(sharedUser => sharedUser.id === user.id);
    const isPublic = document.isPublic;

    if (!isOwner && !isSharedWithUser && !isPublic) {
      throw new ForbiddenException(`You don't have permission to access this document`);
    }

    return document;
  }

  async shareDocument(id: string, shareDocumentDto: ShareDocumentDto, user: User): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['uploadedBy', 'sharedWith'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Only the document owner can share it
    if (document.uploadedBy.id !== user.id) {
      throw new ForbiddenException(`Only the document owner can share it`);
    }

    // Find users to share with
    const usersToShare = await this.userRepository.find({
      where: { id: In(shareDocumentDto.userIds) },
    });

    if (usersToShare.length === 0) {
      throw new NotFoundException(`No valid users found for sharing`);
    }

    // Update the document's shared users
    document.sharedWith = [...document.sharedWith || [], ...usersToShare];

    // Update public status if provided
    if (shareDocumentDto.isPublic !== undefined) {
      document.isPublic = shareDocumentDto.isPublic;
    }

    return this.documentsRepository.save(document);
  }

  async unshareDocument(id: string, userId: string, user: User): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['uploadedBy', 'sharedWith'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Only the document owner can unshare it
    if (document.uploadedBy.id !== user.id) {
      throw new ForbiddenException(`Only the document owner can unshare it`);
    }

    // Remove the user from shared users
    document.sharedWith = document.sharedWith.filter(sharedUser => sharedUser.id !== userId);

    return this.documentsRepository.save(document);
  }

  async setDocumentPublic(id: string, isPublic: boolean, user: User): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Only the document owner can change public status
    if (document.uploadedBy.id !== user.id) {
      throw new ForbiddenException(`Only the document owner can change public status`);
    }

    document.isPublic = isPublic;
    return this.documentsRepository.save(document);
  }

  async remove(id: string, user: User): Promise<void> {
    const document = await this.findOne(id, user);

    // Only the document owner can delete it
    if (document.uploadedBy.id !== user.id) {
      throw new ForbiddenException(`Only the document owner can delete it`);
    }

    // Delete from Cloudinary if it exists there
    if (document.cloudinaryPublicId) {
      try {
        await this.cloudinaryService.deleteFile(document.cloudinaryPublicId);
      } catch (error) {
        console.error(`Error deleting file from Cloudinary: ${error.message}`);
      }
    }

    await this.documentsRepository.remove(document);
  }

  async searchSimilarDocuments(query: string, user: User, paginationDto?: PaginationDto): Promise<PaginatedResult<Document>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = paginationDto || {};
      const offset = (page - 1) * limit;

      // Create a query builder to search for documents
      const queryBuilder = this.documentsRepository
        .createQueryBuilder('document')
        .leftJoinAndSelect('document.uploadedBy', 'uploader')
        .leftJoinAndSelect('document.sharedWith', 'sharedUser')
        .where([
          {
            uploadedBy: { id: user.id },
            originalName: Like(`%${query}%`)
          },
          {
            uploadedBy: { id: user.id },
            description: Like(`%${query}%`)
          },
          {
            isPublic: true,
            originalName: Like(`%${query}%`)
          },
          {
            isPublic: true,
            description: Like(`%${query}%`)
          }
        ])
        .orWhere('sharedUser.id = :userId AND (document.originalName LIKE :query OR document.description LIKE :query)',
          { userId: user.id, query: `%${query}%` });

      // Add sorting
      const validSortFields = ['createdAt', 'updatedAt', 'originalName', 'size', 'type'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      queryBuilder.orderBy(`document.${sortField}`, sortOrder);

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const documents = await queryBuilder
        .skip(offset)
        .take(limit)
        .getMany();

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      console.error('Error searching documents:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }

  // Keep the old method for backward compatibility
  async searchSimilarDocumentsLegacy(query: string, user: User): Promise<Document[]> {
    const result = await this.searchSimilarDocuments(query, user);
    return result.data;
  }

  async advancedSearch(searchDto: AdvancedSearchDto, user: User, paginationDto?: PaginationDto): Promise<PaginatedResult<Document>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = paginationDto || {};
      const offset = (page - 1) * limit;

      // Build the base query
      const queryBuilder = this.documentsRepository
        .createQueryBuilder('document')
        .leftJoinAndSelect('document.uploadedBy', 'uploader')
        .leftJoinAndSelect('document.sharedWith', 'sharedUser');

      // Apply user access filters
      queryBuilder.where([
        { uploadedBy: { id: user.id } },
        { isPublic: true }
      ]).orWhere('sharedUser.id = :userId', { userId: user.id });

      // Apply search filters
      if (searchDto.query) {
        queryBuilder.andWhere(
          '(document.originalName ILIKE :query OR document.description ILIKE :query OR document.textExcerpt ILIKE :query)',
          { query: `%${searchDto.query}%` }
        );
      }

      if (searchDto.clientName) {
        queryBuilder.andWhere(
          "document.extractedInfo->>'client_name' ILIKE :clientName",
          { clientName: `%${searchDto.clientName}%` }
        );
      }

      if (searchDto.exactDate) {
        queryBuilder.andWhere(
          'document."extractedInfo"->>\'date\' = :exactDate',
          { exactDate: searchDto.exactDate }
        );
      }

      if (searchDto.dateFrom && searchDto.dateTo) {
        queryBuilder.andWhere(
          "document.extractedInfo->>'date' BETWEEN :dateFrom AND :dateTo",
          { dateFrom: searchDto.dateFrom, dateTo: searchDto.dateTo }
        );
      } else if (searchDto.dateFrom) {
        queryBuilder.andWhere(
          "document.extractedInfo->>'date' >= :dateFrom",
          { dateFrom: searchDto.dateFrom }
        );
      } else if (searchDto.dateTo) {
        queryBuilder.andWhere(
          "document.extractedInfo->>'date' <= :dateTo",
          { dateTo: searchDto.dateTo }
        );
      }

      if (searchDto.documentType) {
        queryBuilder.andWhere('document.type = :documentType', { documentType: searchDto.documentType });
      }

      if (searchDto.filename) {
        queryBuilder.andWhere('document.originalName ILIKE :filename', { filename: `%${searchDto.filename}%` });
      }

      if (searchDto.description) {
        queryBuilder.andWhere('document.description ILIKE :description', { description: `%${searchDto.description}%` });
      }

      if (searchDto.minSize) {
        queryBuilder.andWhere('document.size >= :minSize', { minSize: searchDto.minSize });
      }

      if (searchDto.maxSize) {
        queryBuilder.andWhere('document.size <= :maxSize', { maxSize: searchDto.maxSize });
      }

      if (searchDto.mimeType) {
        queryBuilder.andWhere('document.mimeType = :mimeType', { mimeType: searchDto.mimeType });
      }

      // Add sorting
      const validSortFields = ['createdAt', 'updatedAt', 'originalName', 'size', 'type'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      queryBuilder.orderBy(`document.${sortField}`, sortOrder);

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const documents = await queryBuilder
        .skip(offset)
        .take(limit)
        .getMany();

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      console.error('Error in advanced search:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }

  // Gets the download URL for a document with a secure signed URL
  getDocumentUrl(document: Document): string {
    if (!document.cloudinaryPublicId) {
      return null;
    }

    // Generate a signed URL with 1-hour expiration
    return this.cloudinaryService.getSignedUrl(
      document.cloudinaryPublicId,
      3600, // 1 hour expiration
      { resource_type: document.cloudinaryMetadata?.resource_type || 'auto' }
    );
  }

  // Generate a temporary signed URL for viewing a document
  getTemporaryViewUrl(document: Document, expirySeconds: number = 3600): string {
    if (!document.cloudinaryPublicId) {
      return null;
    }

    // Generate a signed URL with specified expiration
    return this.cloudinaryService.getSignedUrl(
      document.cloudinaryPublicId,
      expirySeconds,
      { resource_type: document.cloudinaryMetadata?.resource_type || 'auto' }
    );
  }

  // Get list of users who have access to the document
  async getDocumentSharedUsers(id: string, user: User): Promise<User[]> {
    const document = await this.findOne(id, user);

    // Only the document owner can see shared users
    if (document.uploadedBy.id !== user.id) {
      throw new ForbiddenException(`Only the document owner can view shared users`);
    }

    return document.sharedWith || [];
  }

  async semanticSearch(searchDto: SemanticSearchDto, user: User, paginationDto?: PaginationDto): Promise<PaginatedResult<SemanticSearchResult>> {
    try {
      const { page = 1, limit = 10, sortBy = 'similarity', sortOrder = 'DESC' } = paginationDto || {};
      const { query, similarityThreshold = 0.1, maxResults = 50 } = searchDto;

      // Generate embedding for the search query
      const queryEmbedding = await this.embeddingService.generateQueryEmbedding(query);

      if (!queryEmbedding) {
        console.log('⚠️ No embedding generated, returning empty results');
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      // Build the base query with vector similarity
      const queryBuilder = this.documentsRepository
        .createQueryBuilder('document')
        .leftJoinAndSelect('document.uploadedBy', 'uploader')
        .leftJoinAndSelect('document.sharedWith', 'sharedUser')
        .where('document.embedding IS NOT NULL') // Only documents with embeddings
        .andWhere([
          { uploadedBy: { id: user.id } },
          { isPublic: true }
        ])
        .orWhere('sharedUser.id = :userId AND document.embedding IS NOT NULL', { userId: user.id });

      // Add additional filters
      if (searchDto.documentType) {
        queryBuilder.andWhere('document.type = :documentType', { documentType: searchDto.documentType });
      }

      if (searchDto.clientName) {
        queryBuilder.andWhere(
          'document."extractedInfo"->>\'client_name\' ILIKE :clientName',
          { clientName: `%${searchDto.clientName}%` }
        );
      }

      if (searchDto.dateFrom && searchDto.dateTo) {
        queryBuilder.andWhere(
          'document."extractedInfo"->>\'date\' BETWEEN :dateFrom AND :dateTo',
          { dateFrom: searchDto.dateFrom, dateTo: searchDto.dateTo }
        );
      } else if (searchDto.dateFrom) {
        queryBuilder.andWhere(
          'document."extractedInfo"->>\'date\' >= :dateFrom',
          { dateFrom: searchDto.dateFrom }
        );
      } else if (searchDto.dateTo) {
        queryBuilder.andWhere(
          'document."extractedInfo"->>\'date\' <= :dateTo',
          { dateTo: searchDto.dateTo }
        );
      }

      // Validate query embedding
      if (!this.embeddingService.validateEmbedding(queryEmbedding)) {
        throw new Error('Invalid query embedding dimensions');
      }

      // Add vector similarity calculation and filtering
      const vectorString = this.embeddingService.arrayToVector(queryEmbedding);

      queryBuilder
        .addSelect(`1 - (document.embedding <=> '${vectorString}'::vector)`, 'similarity')
        .andWhere(`1 - (document.embedding <=> '${vectorString}'::vector) >= :threshold`, { threshold: similarityThreshold })
        .orderBy('similarity', 'DESC')
        .limit(maxResults);

      console.log(`🔍 Semantic search: query="${query}", threshold=${similarityThreshold}, maxResults=${maxResults}`);

      // Get results with similarity scores
      const rawResults = await queryBuilder.getRawAndEntities();

      // Process results to include similarity scores
      const resultsWithSimilarity: SemanticSearchResult[] = rawResults.entities.map((document, index) => ({
        document,
        similarity: parseFloat(rawResults.raw[index].similarity),
        rank: index + 1
      }));

      // Apply pagination to the results
      const total = resultsWithSimilarity.length;
      const offset = (page - 1) * limit;
      const paginatedResults = resultsWithSimilarity.slice(offset, offset + limit);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      console.error('Error in semantic search:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }

  // Hybrid search: combines semantic search with traditional filters
  async hybridSearch(searchDto: SemanticSearchDto, user: User, paginationDto?: PaginationDto): Promise<PaginatedResult<SemanticSearchResult>> {
    try {
      // First, get semantic search results
      const semanticResults = await this.semanticSearch(searchDto, user, { ...paginationDto, limit: 100 });

      // Then apply additional text-based filtering if needed
      let filteredResults = semanticResults.data;

      // You can add additional text-based filtering here if needed
      // For example, boost results that also match text search

      // Apply final pagination
      const { page = 1, limit = 10 } = paginationDto || {};
      const offset = (page - 1) * limit;
      const total = filteredResults.length;
      const paginatedResults = filteredResults.slice(offset, offset + limit);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      console.error('Error in hybrid search:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }

  // Smart search: Embedding-based search with precise filtering
  async smartSearch(searchDto: SmartSearchDto, user: User, paginationDto?: PaginationDto): Promise<PaginatedResult<SmartSearchResult>> {
    try {
      const { page = 1, limit = 10 } = paginationDto || {};
      const { clientName, year, query } = searchDto;

      // Build the base query with user access filters
      const queryBuilder = this.documentsRepository
        .createQueryBuilder('document')
        .leftJoinAndSelect('document.uploadedBy', 'uploader')
        .leftJoinAndSelect('document.sharedWith', 'sharedUser')
        .where('document.embedding IS NOT NULL') // Only documents with embeddings
        .andWhere([
          { uploadedBy: { id: user.id } },
          { isPublic: true }
        ])
        .orWhere('sharedUser.id = :userId AND document.embedding IS NOT NULL', { userId: user.id });

      // Apply precise filters
      if (clientName) {
        const cleanClientName = clientName.trim(); // Remove any whitespace/newlines
        queryBuilder.andWhere(
          'document."extractedInfo"->>\'client_name\' ILIKE :clientName',
          { clientName: `%${cleanClientName}%` }
        );
      }

      if (year) {
        queryBuilder.andWhere(
          'EXTRACT(YEAR FROM TO_DATE(document."extractedInfo"->>\'date\', \'YYYY-MM-DD\')) = :year',
          { year }
        );
      }

      // If we have a text query, use embedding similarity
      if (query) {
        const queryEmbedding = await this.embeddingService.generateQueryEmbedding(query);

        if (queryEmbedding && this.embeddingService.validateEmbedding(queryEmbedding)) {
          const vectorString = this.embeddingService.arrayToVector(queryEmbedding);

          queryBuilder
            .addSelect(`1 - (document.embedding <=> '${vectorString}'::vector)`, 'similarity')
            .orderBy('similarity', 'DESC');
        } else {
          // Fallback to date ordering if no embedding
          queryBuilder.orderBy('document.createdAt', 'DESC');
        }
      } else {
        // No text query, just order by date
        queryBuilder.orderBy('document.createdAt', 'DESC');
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const offset = (page - 1) * limit;
      const documents = await queryBuilder
        .skip(offset)
        .take(limit)
        .getRawAndEntities();

      // Process results
      const resultsWithDetails: SmartSearchResult[] = documents.entities.map((document, index) => {
        let matchType: 'client_name' | 'year' | 'text' | 'multiple' = 'text';
        let matchDetails = '';

        const matchCount = [clientName, year, query].filter(Boolean).length;

        if (matchCount > 1) {
          matchType = 'multiple';
          matchDetails = `Matched: ${[
            clientName && 'client name',
            year && 'year',
            query && 'text search'
          ].filter(Boolean).join(', ')}`;
        } else if (clientName) {
          matchType = 'client_name';
          matchDetails = `Client: ${document.extractedInfo?.client_name || 'N/A'}`;
        } else if (year) {
          matchType = 'year';
          matchDetails = `Year: ${year}`;
        } else if (query) {
          matchType = 'text';
          const similarity = documents.raw[index]?.similarity || 0;
          matchDetails = `Similarity: ${(similarity * 100).toFixed(1)}%`;
        }

        return {
          document,
          matchType,
          matchDetails
        };
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      console.log(`🎯 Smart search: clientName="${clientName}", year=${year}, query="${query}", results=${resultsWithDetails.length}`);

      return {
        data: resultsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      console.error('Error in smart search:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }

  async generateBilanReport(documentIds: string[], user: User, periodDays: number = 90): Promise<any> {
    try {
      // Fetch documents that the user has access to
      const documents = await this.documentsRepository
        .createQueryBuilder('document')
        .leftJoinAndSelect('document.uploadedBy', 'uploader')
        .leftJoinAndSelect('document.sharedWith', 'sharedUser')
        .where('document.id IN (:...documentIds)', { documentIds })
        .andWhere([
          { uploadedBy: { id: user.id } },
          { isPublic: true }
        ])
        .orWhere('sharedUser.id = :userId AND document.id IN (:...documentIds)', {
          userId: user.id,
          documentIds
        })
        .getMany();

      if (documents.length === 0) {
        throw new Error('No accessible documents found with the provided IDs');
      }

      console.log(`📊 Found ${documents.length} accessible documents out of ${documentIds.length} requested`);

      // Log which documents were found vs requested
      const foundIds = documents.map(d => d.id);
      const missingIds = documentIds.filter(id => !foundIds.includes(id));
      if (missingIds.length > 0) {
        console.warn(`⚠️ Missing documents: ${missingIds.join(', ')}`);
      }

      // Validate that we have some financial documents
      const financialTypes = ['invoice', 'receipt', 'purchase_order', 'bank_statement', 'payslip', 'expense_report'];
      const hasFinancialDocs = documents.some(doc => financialTypes.includes(doc.type));

      if (!hasFinancialDocs) {
        console.warn('⚠️ No financial documents found in selection, bilan may be incomplete');
      }

      // Transform documents to the format expected by the external API
      const documentsData = documents.map(doc => {
        let extractedInfo: any = {};

        // Parse extracted_info properly
        if (doc.extractedInfo) {
          if (typeof doc.extractedInfo === 'string') {
            try {
              extractedInfo = JSON.parse(doc.extractedInfo);
            } catch (e) {
              console.warn(`Failed to parse extractedInfo for document ${doc.id}:`, e);
              extractedInfo = {};
            }
          } else {
            extractedInfo = doc.extractedInfo;
          }
        }

        // Ensure we have the minimum required fields for bilan generation
        const processedExtractedInfo = {
          date: extractedInfo.date || new Date(doc.createdAt).toISOString().split('T')[0],
          client_name: extractedInfo.client_name || 'Unknown Client',
          amount: extractedInfo.amount || 0,
          currency: extractedInfo.currency || 'TND',
          ...extractedInfo // Keep any additional fields
        };

        const transformedDoc = {
          id: doc.id,
          filename: doc.originalName,
          document_type: doc.type,
          confidence: doc.modelConfidence || 0.95,
          extracted_text: doc.textExcerpt || '',
          extracted_info: JSON.stringify(processedExtractedInfo), // External API expects string format
          created_at: doc.createdAt.toISOString()
        };

        console.log(`🔍 Transformed document ${doc.id}:`, {
          ...transformedDoc,
          extracted_info: processedExtractedInfo // Log as object for readability
        });

        return transformedDoc;
      });

      console.log(`📊 Generating bilan for ${documents.length} documents for user ${user.id}`);
      console.log('Document types:', documents.map(d => d.type).join(', '));

      // Debug: Log the raw document data from database
      console.log('📋 Raw document data from DB:');
      documents.forEach(doc => {
        console.log(`- Document ${doc.id}:`);
        console.log(`  - originalName: ${doc.originalName}`);
        console.log(`  - type: ${doc.type}`);
        console.log(`  - textExcerpt: ${doc.textExcerpt?.substring(0, 100)}...`);
        console.log(`  - extractedInfo (raw):`, doc.extractedInfo);
        console.log(`  - extractedInfo type:`, typeof doc.extractedInfo);
      });

      // Prepare the payload for the external API
      const payload = {
        documents: documentsData,
        period_days: periodDays
      };

      console.log('🔄 Sending bilan request to external API:');
      console.log('📤 Payload:', JSON.stringify(payload, null, 2));

      // Call the external bilan API
      const response = await axios.post('http://127.0.0.1:8000/bilan', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      });

      console.log('✅ Bilan API response received:', response.status);

      return response.data;
    } catch (error) {
      console.error('❌ Error generating bilan report:', error);

      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('API Error Response:', error.response.data);
        throw new Error(`External API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response from API:', error.request);
        throw new Error('No response from bilan API service');
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', error.message);
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  // Simple semantic search: Uses embeddings to search by client name or date
  async simpleSemanticSearch(searchDto: SimpleSearchDto, user: User, paginationDto?: PaginationDto): Promise<PaginatedResult<SemanticSearchResult>> {
    try {
      const { page = 1, limit = 10 } = paginationDto || {};
      const { clientName, date, similarityThreshold = 0.3, exactClientMatch = false } = searchDto;

      // Build search query from client name and/or date
      let searchQuery = '';
      if (clientName && date) {
        searchQuery = `${clientName} ${date}`;
      } else if (clientName) {
        searchQuery = clientName;
      } else if (date) {
        searchQuery = date;
      } else {
        return {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      console.log(`🔍 Simple semantic search: query="${searchQuery}", threshold=${similarityThreshold}, exactClientMatch=${exactClientMatch}`);

      // Generate embedding for the search query
      const queryEmbedding = await this.embeddingService.generateQueryEmbedding(searchQuery);

      if (!queryEmbedding) {
        console.log('⚠️ No embedding generated');
        return {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      // Build the base query with vector similarity
      const queryBuilder = this.documentsRepository
        .createQueryBuilder('document')
        .leftJoinAndSelect('document.uploadedBy', 'uploader')
        .leftJoinAndSelect('document.sharedWith', 'sharedUser')
        .where('document.embedding IS NOT NULL') // Only documents with embeddings
        .andWhere([
          { uploadedBy: { id: user.id } },
          { isPublic: true }
        ])
        .orWhere('sharedUser.id = :userId AND document.embedding IS NOT NULL', { userId: user.id });

      // Add exact client name filter if requested
      if (exactClientMatch && clientName) {
        const cleanClientName = clientName.trim();
        queryBuilder.andWhere(
          'document."extractedInfo"->>\'client_name\' = :exactClientName',
          { exactClientName: cleanClientName }
        );
      }

      // Add date filter if provided (supports full date or year only)
      if (date) {
        const cleanDate = date.trim();

        // If the search date is 4 digits (year only), filter by year
        if (/^\d{4}$/.test(cleanDate)) {
          queryBuilder.andWhere(
            'SUBSTRING(document."extractedInfo"->>\'date\', 1, 4) = :year',
            { year: cleanDate }
          );
        } else {
          // Full date match
          queryBuilder.andWhere(
            'document."extractedInfo"->>\'date\' = :exactDate',
            { exactDate: cleanDate }
          );
        }
      }

      // Validate query embedding
      if (!this.embeddingService.validateEmbedding(queryEmbedding)) {
        throw new Error('Invalid query embedding dimensions');
      }

      // Add vector similarity calculation and filtering
      const vectorString = this.embeddingService.arrayToVector(queryEmbedding);

      queryBuilder
        .addSelect(`1 - (document.embedding <=> '${vectorString}'::vector)`, 'similarity')
        .andWhere(`1 - (document.embedding <=> '${vectorString}'::vector) >= :threshold`, { threshold: similarityThreshold })
        .orderBy('similarity', 'DESC')
        .limit(50); // Get top 50 results

      // Get results with similarity scores
      const rawResults = await queryBuilder.getRawAndEntities();

      // Process results to include similarity scores
      let resultsWithSimilarity: SemanticSearchResult[] = rawResults.entities.map((document, index) => ({
        document,
        similarity: parseFloat(rawResults.raw[index].similarity),
        rank: index + 1
      }));

      // Always filter for exact matches when clientName and/or date are provided
      // This ensures we only get documents with exact matches
      if (clientName || date) {
        resultsWithSimilarity = resultsWithSimilarity.filter(result => {
          let clientMatch = true;
          let dateMatch = true;

          // Check exact client name match if provided
          if (clientName) {
            const cleanClientName = clientName.trim();
            clientMatch = result.document.extractedInfo?.client_name === cleanClientName;
          }

          // Check date match if provided (supports full date or year only)
          if (date) {
            const cleanDate = date.trim();
            const documentDate = result.document.extractedInfo?.date;

            if (documentDate) {
              // If the search date is 4 digits (year only), extract year from document date
              if (/^\d{4}$/.test(cleanDate)) {
                const documentYear = documentDate.substring(0, 4);
                dateMatch = documentYear === cleanDate;
              } else {
                // Full date match
                dateMatch = documentDate === cleanDate;
              }
            } else {
              dateMatch = false;
            }
          }

          // Both conditions must be true (if provided)
          return clientMatch && dateMatch;
        });

        // Re-rank after filtering
        resultsWithSimilarity = resultsWithSimilarity.map((result, index) => ({
          ...result,
          rank: index + 1
        }));
      }

      // Apply pagination to the results
      const total = resultsWithSimilarity.length;
      const offset = (page - 1) * limit;
      const paginatedResults = resultsWithSimilarity.slice(offset, offset + limit);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const filterDetails = [];
      if (clientName) filterDetails.push('exact client match');
      if (date) filterDetails.push('exact date match');
      const filterText = filterDetails.length > 0 ? ` with ${filterDetails.join(' and ')}` : '';

      console.log(`✅ Found ${total} results with similarity >= ${similarityThreshold}${filterText}`);

      return {
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      console.error('Error in simple semantic search:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }
}