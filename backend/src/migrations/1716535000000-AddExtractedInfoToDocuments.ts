import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExtractedInfoToDocuments1716535000000 implements MigrationInterface {
    name = 'AddExtractedInfoToDocuments1716535000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add extractedInfo column to document table
        await queryRunner.query(`ALTER TABLE "document" ADD "extractedInfo" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove extractedInfo column
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "extractedInfo"`);
    }
}