import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentSharing1716533000000 implements MigrationInterface {
    name = 'AddDocumentSharing1716533000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add isPublic column to document table
        await queryRunner.query(`ALTER TABLE "document" ADD "isPublic" boolean NOT NULL DEFAULT false`);
        
        // Create the document_shared_users junction table
        await queryRunner.query(`
            CREATE TABLE "document_shared_users" (
                "document_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                CONSTRAINT "PK_document_shared_users" PRIMARY KEY ("document_id", "user_id")
            )
        `);
        
        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "document_shared_users" 
            ADD CONSTRAINT "FK_document_shared_users_document" 
            FOREIGN KEY ("document_id") REFERENCES "document"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
        `);
        
        await queryRunner.query(`
            ALTER TABLE "document_shared_users" 
            ADD CONSTRAINT "FK_document_shared_users_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "document_shared_users" DROP CONSTRAINT "FK_document_shared_users_user"`);
        await queryRunner.query(`ALTER TABLE "document_shared_users" DROP CONSTRAINT "FK_document_shared_users_document"`);
        
        // Drop the junction table
        await queryRunner.query(`DROP TABLE "document_shared_users"`);
        
        // Remove isPublic column
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "isPublic"`);
    }
} 