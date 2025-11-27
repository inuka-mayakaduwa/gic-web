/*
  Warnings:

  - You are about to drop the column `password` on the `SystemUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SystemUser" DROP COLUMN "password",
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otpExpires" TIMESTAMP(3);
