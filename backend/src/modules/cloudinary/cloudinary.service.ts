import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cloudinary from 'cloudinary';
import * as streamifier from 'streamifier';
import * as sharp from 'sharp';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  // Max file size constants in bytes
  private readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB max file size
  private readonly COMPRESSION_THRESHOLD = 5 * 1024 * 1024; // 5MB - files larger than this will be compressed

  constructor(private configService: ConfigService) {
    // Configure cloudinary
    cloudinary.v2.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a file to Cloudinary with compression
   * @param file The file buffer to upload
   * @param options Additional options for the upload
   * @returns Cloudinary upload result
   */
  async uploadFile(file: Buffer, options: any = {}): Promise<any> {
    try {
      // Check file size
      if (file.length > this.MAX_FILE_SIZE) {
        throw new BadRequestException(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      // Compress the file if it's an image
      let fileBuffer = file;
      
      // Check MIME type by examining buffer signature
      const isPDF = file.toString('ascii', 0, 5) === '%PDF-';
      const isImage = 
        file[0] === 0xFF && file[1] === 0xD8 || // JPEG
        (file[0] === 0x89 && file[1] === 0x50 && file[2] === 0x4E && file[3] === 0x47); // PNG
      
      // Log file size before compression
      this.logger.log(`File size before compression: ${(file.length / (1024 * 1024)).toFixed(2)}MB`);
      
      // Compress based on file type and size
      if (isImage) {
        // Apply stronger compression for large images
        const compressionLevel = file.length > this.COMPRESSION_THRESHOLD ? 'high' : 'medium';
        fileBuffer = await this.compressImage(file, compressionLevel);
      } else if (isPDF) {
        // For PDFs, we'll use Cloudinary's built-in compression
        options.resource_type = 'raw';
        
        if (file.length > this.COMPRESSION_THRESHOLD) {
          // Add PDF-specific optimization flags if file is large
          options.quality = 'auto:low';
        }
      } else {
        // For other file types, just upload as raw with size warning
        options.resource_type = 'raw';
        if (file.length > this.COMPRESSION_THRESHOLD) {
          this.logger.warn(`Large non-compressible file being uploaded: ${(file.length / (1024 * 1024)).toFixed(2)}MB`);
        }
      }
      
      // Log file size after compression if applicable
      if (file !== fileBuffer) {
        this.logger.log(`File size after compression: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB`);
      }
      
      // Set default options if not provided
      const uploadOptions = {
        folder: 'documents',
        resource_type: 'auto',
        type: 'private', // Make all files private by default
        access_mode: 'authenticated', // Require authentication
        ...options
      };

      // Use promise to handle the stream upload
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              this.logger.error(`Failed to upload file to Cloudinary: ${error.message}`);
              return reject(error);
            }
            return resolve(result);
          }
        );

        // Create a stream from the buffer and pipe it to the upload stream
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
      });
    } catch (error) {
      this.logger.error(`Error in file upload: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compress an image using sharp
   * @param buffer Image buffer
   * @param compressionLevel Compression level (low, medium, high)
   * @returns Compressed image buffer
   */
  async compressImage(buffer: Buffer, compressionLevel: 'low' | 'medium' | 'high' = 'medium'): Promise<Buffer> {
    try {
      // Determine image format
      const metadata = await sharp(buffer).metadata();
      
      // Set quality based on compression level
      let jpegQuality = 80;
      let pngCompressionLevel = 9;
      let maxDimension = 1920;
      
      switch (compressionLevel) {
        case 'low':
          jpegQuality = 90;
          pngCompressionLevel = 7;
          maxDimension = 2560;
          break;
        case 'medium':
          jpegQuality = 80;
          pngCompressionLevel = 9;
          maxDimension = 1920;
          break;
        case 'high':
          jpegQuality = 60;
          pngCompressionLevel = 9;
          maxDimension = 1280;
          break;
      }
      
      // Set compression options based on format
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        return sharp(buffer)
          .jpeg({ quality: jpegQuality, progressive: true })
          .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();
      } else if (metadata.format === 'png') {
        return sharp(buffer)
          .png({ compressionLevel: pngCompressionLevel, progressive: true })
          .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();
      } else {
        // For other image formats, convert to JPEG
        return sharp(buffer)
          .jpeg({ quality: jpegQuality, progressive: true })
          .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();
      }
    } catch (error) {
      this.logger.error(`Error compressing image: ${error.message}`);
      // If compression fails, return the original buffer
      return buffer;
    }
  }

  /**
   * Generate a signed URL for a file with expiration
   * @param publicId The public ID of the file
   * @param expirySeconds Time in seconds until URL expires (default: 1 hour)
   * @returns Signed URL with expiration
   */
  getSignedUrl(publicId: string, expirySeconds: number = 3600, options: any = {}): string {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      
      // Set options for the URL
      const urlOptions = {
        secure: true,
        type: 'private',
        resource_type: options.resource_type || 'auto',
        sign_url: true,
        expires_at: timestamp + expirySeconds,
        ...options
      };
      
      // Generate the signed URL
      return cloudinary.v2.url(publicId, urlOptions);
    } catch (error) {
      this.logger.error(`Error generating signed URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download a file from Cloudinary
   * @param publicId The public ID of the file
   * @returns The file URL
   */
  getFileUrl(publicId: string, options: any = {}): string {
    try {
      // Set options for the URL
      const urlOptions = {
        secure: true,
        ...options
      };
      
      // Generate the URL
      return cloudinary.v2.url(publicId, urlOptions);
    } catch (error) {
      this.logger.error(`Error generating file URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId The public ID of the file
   * @returns The deletion result
   */
  async deleteFile(publicId: string): Promise<any> {
    try {
      return await cloudinary.v2.uploader.destroy(publicId, { resource_type: 'auto', type: 'private' });
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw error;
    }
  }
} 