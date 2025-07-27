import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetFields1716534000000 implements MigrationInterface {
    name = 'AddPasswordResetFields1716534000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add reset password token column
        await queryRunner.query(`ALTER TABLE "users" ADD "resetPasswordToken" character varying`);
        
        // Add reset password expires column
        await queryRunner.query(`ALTER TABLE "users" ADD "resetPasswordExpires" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove reset password expires column
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetPasswordExpires"`);
        
        // Remove reset password token column
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetPasswordToken"`);
    }
}