-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone_number" TEXT,
ALTER COLUMN "email" DROP NOT NULL;
