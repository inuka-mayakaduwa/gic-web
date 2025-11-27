/*
  Warnings:

  - You are about to drop the column `username` on the `SystemUser` table. All the data in the column will be lost.
  - Added the required column `name` to the `SystemUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "SystemUser_username_key";

-- AlterTable
ALTER TABLE "SystemUser" RENAME COLUMN "username" TO "name";
ALTER TABLE "SystemUser" ADD COLUMN "mobile" TEXT;
