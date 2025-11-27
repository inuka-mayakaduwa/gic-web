/*
  Warnings:

  - You are about to drop the column `description` on the `ContactInfo` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `OfficeBranch` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `OfficeBranch` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `OrganizationCategory` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `designation` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDetails` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `processingTime` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `requiredDocs` on the `Service` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `News` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `OfficeBranch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `OrganizationCategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nameEn]` on the table `OrganizationCategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Person` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Service` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nameEn` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentEn` to the `News` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `News` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titleEn` to the `News` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameEn` to the `OfficeBranch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `OfficeBranch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameEn` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameEn` to the `OrganizationCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `OrganizationCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullNameEn` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameEn` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "OrganizationCategory_name_key";

-- AlterTable
ALTER TABLE "ContactInfo" DROP COLUMN "description",
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "descriptionSi" TEXT,
ADD COLUMN     "descriptionTa" TEXT;

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "descriptionSi" TEXT,
ADD COLUMN     "descriptionTa" TEXT,
ADD COLUMN     "nameEn" TEXT NOT NULL,
ADD COLUMN     "nameSi" TEXT,
ADD COLUMN     "nameTa" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "News" DROP COLUMN "content",
DROP COLUMN "summary",
DROP COLUMN "title",
ADD COLUMN     "contentEn" TEXT NOT NULL,
ADD COLUMN     "contentSi" TEXT,
ADD COLUMN     "contentTa" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "summaryEn" TEXT,
ADD COLUMN     "summarySi" TEXT,
ADD COLUMN     "summaryTa" TEXT,
ADD COLUMN     "titleEn" TEXT NOT NULL,
ADD COLUMN     "titleSi" TEXT,
ADD COLUMN     "titleTa" TEXT;

-- AlterTable
ALTER TABLE "OfficeBranch" DROP COLUMN "address",
DROP COLUMN "name",
ADD COLUMN     "addressEn" TEXT,
ADD COLUMN     "addressSi" TEXT,
ADD COLUMN     "addressTa" TEXT,
ADD COLUMN     "nameEn" TEXT NOT NULL,
ADD COLUMN     "nameSi" TEXT,
ADD COLUMN     "nameTa" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "address",
DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "addressEn" TEXT,
ADD COLUMN     "addressSi" TEXT,
ADD COLUMN     "addressTa" TEXT,
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "descriptionSi" TEXT,
ADD COLUMN     "descriptionTa" TEXT,
ADD COLUMN     "nameEn" TEXT NOT NULL,
ADD COLUMN     "nameSi" TEXT,
ADD COLUMN     "nameTa" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrganizationCategory" DROP COLUMN "name",
ADD COLUMN     "nameEn" TEXT NOT NULL,
ADD COLUMN     "nameSi" TEXT,
ADD COLUMN     "nameTa" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "bio",
DROP COLUMN "designation",
DROP COLUMN "fullName",
DROP COLUMN "title",
ADD COLUMN     "bioEn" TEXT,
ADD COLUMN     "bioSi" TEXT,
ADD COLUMN     "bioTa" TEXT,
ADD COLUMN     "designationEn" TEXT,
ADD COLUMN     "designationSi" TEXT,
ADD COLUMN     "designationTa" TEXT,
ADD COLUMN     "fullNameEn" TEXT NOT NULL,
ADD COLUMN     "fullNameSi" TEXT,
ADD COLUMN     "fullNameTa" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "titleEn" TEXT,
ADD COLUMN     "titleSi" TEXT,
ADD COLUMN     "titleTa" TEXT;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "paymentDetails",
DROP COLUMN "processingTime",
DROP COLUMN "requiredDocs",
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "descriptionSi" TEXT,
ADD COLUMN     "descriptionTa" TEXT,
ADD COLUMN     "nameEn" TEXT NOT NULL,
ADD COLUMN     "nameSi" TEXT,
ADD COLUMN     "nameTa" TEXT,
ADD COLUMN     "paymentDetailsEn" TEXT,
ADD COLUMN     "paymentDetailsSi" TEXT,
ADD COLUMN     "paymentDetailsTa" TEXT,
ADD COLUMN     "processingTimeEn" TEXT,
ADD COLUMN     "processingTimeSi" TEXT,
ADD COLUMN     "processingTimeTa" TEXT,
ADD COLUMN     "requiredDocsEn" TEXT,
ADD COLUMN     "requiredDocsSi" TEXT,
ADD COLUMN     "requiredDocsTa" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Department_slug_key" ON "Department"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OfficeBranch_slug_key" ON "OfficeBranch"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationCategory_slug_key" ON "OrganizationCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationCategory_nameEn_key" ON "OrganizationCategory"("nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "Person_slug_key" ON "Person"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
