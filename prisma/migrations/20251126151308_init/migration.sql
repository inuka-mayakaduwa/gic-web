-- CreateTable
CREATE TABLE "SystemUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "profilePic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "address" TEXT,
    "description" TEXT,
    "email" TEXT,
    "hotline" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "OrganizationCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "fullName" TEXT NOT NULL,
    "designation" TEXT,
    "bio" TEXT,
    "image" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInfo" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT,
    "personId" TEXT,
    "departmentId" TEXT,

    CONSTRAINT "ContactInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredDocs" TEXT,
    "paymentDetails" TEXT,
    "processingTime" TEXT,
    "serviceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCTA" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "ServiceCTA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "publishedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeBranch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "officeHours" TEXT,
    "contactNumber" TEXT,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "OfficeBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemPermission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "SystemPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemPermissionGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SystemPermissionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgUserGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "OrgUserGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgCustomGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "OrgCustomGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgPermission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "OrgPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOrgGroupMap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgGroupId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "UserOrgGroupMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOrgCustomGroupMap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgCustomGroupId" TEXT NOT NULL,

    CONSTRAINT "UserOrgCustomGroupMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOrgPermissionMap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "UserOrgPermissionMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OrganizationToOrganizationCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OrganizationToOrganizationCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DepartmentToPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DepartmentToPerson_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_NewsToOrganization" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NewsToOrganization_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SystemPermissionToSystemPermissionGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SystemPermissionToSystemPermissionGroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SystemPermissionToSystemUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SystemPermissionToSystemUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SystemPermissionGroupToSystemUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SystemPermissionGroupToSystemUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OrgCustomGroupToOrgPermission" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OrgCustomGroupToOrgPermission_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OrgPermissionToOrgUserGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OrgPermissionToOrgUserGroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_username_key" ON "SystemUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_email_key" ON "SystemUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationCategory_name_key" ON "OrganizationCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SystemPermission_code_key" ON "SystemPermission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SystemPermissionGroup_name_key" ON "SystemPermissionGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OrgUserGroup_name_key" ON "OrgUserGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OrgPermission_code_key" ON "OrgPermission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrgGroupMap_userId_orgGroupId_organizationId_key" ON "UserOrgGroupMap"("userId", "orgGroupId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrgCustomGroupMap_userId_orgCustomGroupId_key" ON "UserOrgCustomGroupMap"("userId", "orgCustomGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrgPermissionMap_userId_permissionId_organizationId_key" ON "UserOrgPermissionMap"("userId", "permissionId", "organizationId");

-- CreateIndex
CREATE INDEX "_OrganizationToOrganizationCategory_B_index" ON "_OrganizationToOrganizationCategory"("B");

-- CreateIndex
CREATE INDEX "_DepartmentToPerson_B_index" ON "_DepartmentToPerson"("B");

-- CreateIndex
CREATE INDEX "_NewsToOrganization_B_index" ON "_NewsToOrganization"("B");

-- CreateIndex
CREATE INDEX "_SystemPermissionToSystemPermissionGroup_B_index" ON "_SystemPermissionToSystemPermissionGroup"("B");

-- CreateIndex
CREATE INDEX "_SystemPermissionToSystemUser_B_index" ON "_SystemPermissionToSystemUser"("B");

-- CreateIndex
CREATE INDEX "_SystemPermissionGroupToSystemUser_B_index" ON "_SystemPermissionGroupToSystemUser"("B");

-- CreateIndex
CREATE INDEX "_OrgCustomGroupToOrgPermission_B_index" ON "_OrgCustomGroupToOrgPermission"("B");

-- CreateIndex
CREATE INDEX "_OrgPermissionToOrgUserGroup_B_index" ON "_OrgPermissionToOrgUserGroup"("B");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactInfo" ADD CONSTRAINT "ContactInfo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactInfo" ADD CONSTRAINT "ContactInfo_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactInfo" ADD CONSTRAINT "ContactInfo_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCTA" ADD CONSTRAINT "ServiceCTA_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeBranch" ADD CONSTRAINT "OfficeBranch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgCustomGroup" ADD CONSTRAINT "OrgCustomGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgGroupMap" ADD CONSTRAINT "UserOrgGroupMap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SystemUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgGroupMap" ADD CONSTRAINT "UserOrgGroupMap_orgGroupId_fkey" FOREIGN KEY ("orgGroupId") REFERENCES "OrgUserGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgGroupMap" ADD CONSTRAINT "UserOrgGroupMap_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgCustomGroupMap" ADD CONSTRAINT "UserOrgCustomGroupMap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SystemUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgCustomGroupMap" ADD CONSTRAINT "UserOrgCustomGroupMap_orgCustomGroupId_fkey" FOREIGN KEY ("orgCustomGroupId") REFERENCES "OrgCustomGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgPermissionMap" ADD CONSTRAINT "UserOrgPermissionMap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SystemUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgPermissionMap" ADD CONSTRAINT "UserOrgPermissionMap_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "OrgPermission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgPermissionMap" ADD CONSTRAINT "UserOrgPermissionMap_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganizationToOrganizationCategory" ADD CONSTRAINT "_OrganizationToOrganizationCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganizationToOrganizationCategory" ADD CONSTRAINT "_OrganizationToOrganizationCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "OrganizationCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToPerson" ADD CONSTRAINT "_DepartmentToPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToPerson" ADD CONSTRAINT "_DepartmentToPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NewsToOrganization" ADD CONSTRAINT "_NewsToOrganization_A_fkey" FOREIGN KEY ("A") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NewsToOrganization" ADD CONSTRAINT "_NewsToOrganization_B_fkey" FOREIGN KEY ("B") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SystemPermissionToSystemPermissionGroup" ADD CONSTRAINT "_SystemPermissionToSystemPermissionGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "SystemPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SystemPermissionToSystemPermissionGroup" ADD CONSTRAINT "_SystemPermissionToSystemPermissionGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "SystemPermissionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SystemPermissionToSystemUser" ADD CONSTRAINT "_SystemPermissionToSystemUser_A_fkey" FOREIGN KEY ("A") REFERENCES "SystemPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SystemPermissionToSystemUser" ADD CONSTRAINT "_SystemPermissionToSystemUser_B_fkey" FOREIGN KEY ("B") REFERENCES "SystemUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SystemPermissionGroupToSystemUser" ADD CONSTRAINT "_SystemPermissionGroupToSystemUser_A_fkey" FOREIGN KEY ("A") REFERENCES "SystemPermissionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SystemPermissionGroupToSystemUser" ADD CONSTRAINT "_SystemPermissionGroupToSystemUser_B_fkey" FOREIGN KEY ("B") REFERENCES "SystemUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrgCustomGroupToOrgPermission" ADD CONSTRAINT "_OrgCustomGroupToOrgPermission_A_fkey" FOREIGN KEY ("A") REFERENCES "OrgCustomGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrgCustomGroupToOrgPermission" ADD CONSTRAINT "_OrgCustomGroupToOrgPermission_B_fkey" FOREIGN KEY ("B") REFERENCES "OrgPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrgPermissionToOrgUserGroup" ADD CONSTRAINT "_OrgPermissionToOrgUserGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "OrgPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrgPermissionToOrgUserGroup" ADD CONSTRAINT "_OrgPermissionToOrgUserGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "OrgUserGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
