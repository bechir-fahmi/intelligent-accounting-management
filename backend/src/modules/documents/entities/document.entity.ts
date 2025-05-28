import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DocumentType } from '../document-type.enum';

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column({ nullable: true })
  path: string;

  // Cloudinary specific fields
  @Column({ nullable: true })
  cloudinaryPublicId: string;

  @Column({ nullable: true })
  cloudinaryUrl: string;

  @Column({ nullable: true })
  cloudinarySecureUrl: string;
  
  @Column({ nullable: true })
  cloudinaryVersion: string;

  @Column({ nullable: true })
  cloudinaryFormat: string;

  @Column('simple-json', { nullable: true })
  cloudinaryMetadata: Record<string, any>;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER
  })
  type: DocumentType;

  @Column({ nullable: true })
  clientId: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isProcessed: boolean;
  
  // Keep these fields to avoid migration issues but mark as not used
  @Column('float', { array: true, nullable: true })
  embedding: number[];
  
  @Column({ nullable: true })
  textContent: string;

  @ManyToOne(() => User, user => user.documents)
  uploadedBy: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'document_shared_users',
    joinColumn: { name: 'document_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' }
  })
  sharedWith: User[];

  @Column({ default: false })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, type: 'float' })
  modelConfidence: number;

  @Column({ nullable: true })
  modelPrediction: string;

  @Column({ nullable: true })
  finalPrediction: string;

  @Column({ nullable: true })
  textExcerpt: string;
}