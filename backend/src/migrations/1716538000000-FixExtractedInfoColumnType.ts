import { MigrationInterface, QueryRunner } from "typeorm";

export class FixExtractedInfoColumnType1716538000000 implements MigrationInterface {
    name = 'FixExtractedInfoColumnType1716538000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Change extractedInfo column from simple-json to jsonb for proper JSON operations
        await queryRunner.query(`
            ALTER TABLE "document" 
            ALTER COLUMN "extractedInfo" TYPE jsonb 
            USING "extractedInfo"::jsonb
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to simple-json (this might lose some data formatting)
        await queryRunner.query(`
            ALTER TABLE "document" 
            ALTER COLUMN "extractedInfo" TYPE text
        `);
    }
}