/*
  Warnings:

  - You are about to drop the `UserOrgPermissionMap` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SystemPermissionToSystemUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserOrgPermissionMap" DROP CONSTRAINT "UserOrgPermissionMap_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "UserOrgPermissionMap" DROP CONSTRAINT "UserOrgPermissionMap_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "UserOrgPermissionMap" DROP CONSTRAINT "UserOrgPermissionMap_userId_fkey";

-- DropForeignKey
ALTER TABLE "_SystemPermissionToSystemUser" DROP CONSTRAINT "_SystemPermissionToSystemUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_SystemPermissionToSystemUser" DROP CONSTRAINT "_SystemPermissionToSystemUser_B_fkey";

-- DropTable
DROP TABLE "UserOrgPermissionMap";

-- DropTable
DROP TABLE "_SystemPermissionToSystemUser";
