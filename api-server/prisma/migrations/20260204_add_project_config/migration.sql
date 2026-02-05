-- AlterTable
ALTER TABLE "Project" 
ADD COLUMN "env" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "root_dir" TEXT NOT NULL DEFAULT '.',
ADD COLUMN "build_command" TEXT NOT NULL DEFAULT 'npm run build',
ADD COLUMN "install_command" TEXT NOT NULL DEFAULT 'npm install';
