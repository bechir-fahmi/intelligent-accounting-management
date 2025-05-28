import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ShareDocumentDto } from './dto/share-document.dto';
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
  ) {}

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
        type: detectedType,
        // Remove aiRawResponse from entity, but log it for debugging
      });
      if (aiRawResponse) {
        console.error('AI Model API RAW RESPONSE:', aiRawResponse);
      }
      
      const savedDocument = await this.documentsRepository.save(document);
      
      return savedDocument;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async findAll(user: User): Promise<Document[]> {
    // Get both documents uploaded by the user and shared with the user
    const documents = await this.documentsRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.uploadedBy', 'uploader')
      .leftJoinAndSelect('document.sharedWith', 'sharedUser')
      .where([
        { uploadedBy: { id: user.id } }, // Documents uploaded by the user
        { isPublic: true }, // Public documents
      ])
      .orWhere('sharedUser.id = :userId', { userId: user.id }) // Documents shared with the user
      .getMany();

    return documents;
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
  
  async searchSimilarDocuments(query: string, user: User): Promise<Document[]> {
    try {
      // Create a query builder to search for documents
      const documentsQuery = this.documentsRepository
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
      
      return documentsQuery.getMany();
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
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
}