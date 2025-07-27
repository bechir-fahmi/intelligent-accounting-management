import { MigrationInterface, QueryRunner } from "typeorm";

export class EnablePgvectorExtension1716536000000 implements MigrationInterface {
    name = 'EnablePgvectorExtension1716536000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable pgvector extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
        
        // Convert embedding column to vector type for better performance
        // First, we need to handle existing data properly
        await queryRunner.query(`
            ALTER TABLE "document" 
            ALTER COLUMN "embedding" TYPE vector(384) 
            USING CASE 
                WHEN "embedding" IS NULL THEN NULL 
                ELSE "embedding"::vector(384) 
            END
        `);
        
        // Create index for vector similarity search
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_document_embedding ON "document" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index
        await queryRunner.query(`DROP INDEX IF EXISTS idx_document_embedding`);
        
        // Revert column type back to float array
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "embedding" TYPE float[]`);
        
        // Drop pgvector extension
        await queryRunner.query(`DROP EXTENSION IF EXISTS vector`);
    }
}