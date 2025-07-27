import { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertEmbeddingToVector1716537000000 implements MigrationInterface {
    name = 'ConvertEmbeddingToVector1716537000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, let's check if the vector extension is available
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
        
        // Convert the existing float array column to vector type
        // We need to handle this carefully to preserve existing data
        await queryRunner.query(`
            ALTER TABLE "document" 
            ALTER COLUMN "embedding" TYPE vector(384) 
            USING CASE 
                WHEN "embedding" IS NULL THEN NULL 
                WHEN array_length("embedding", 1) = 384 THEN "embedding"::vector(384)
                ELSE NULL
            END
        `);
        
        // Recreate the index with proper vector type
        await queryRunner.query(`DROP INDEX IF EXISTS idx_document_embedding`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_document_embedding ON "document" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the vector index
        await queryRunner.query(`DROP INDEX IF EXISTS idx_document_embedding`);
        
        // Convert back to float array
        await queryRunner.query(`
            ALTER TABLE "document" 
            ALTER COLUMN "embedding" TYPE float[] 
            USING CASE 
                WHEN "embedding" IS NULL THEN NULL 
                ELSE "embedding"::float[]
            END
        `);
    }
}