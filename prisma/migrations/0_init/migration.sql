-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "passwordResetToken" VARCHAR(64),
    "status" TEXT NOT NULL,
    "profilePicture" TEXT,
    "canBeRemoved" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_claims" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "account_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "accountId" INTEGER NOT NULL,
    "document" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "params" JSONB,
    "body" JSONB,
    "statusCode" INTEGER NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" SERIAL NOT NULL,
    "drawer" VARCHAR(255) NOT NULL,
    "wallet" VARCHAR(50) NOT NULL,
    "account" VARCHAR(50) NOT NULL,
    "agency" VARCHAR(50) NOT NULL,
    "bankCode" VARCHAR(20) NOT NULL,
    "bankName" VARCHAR(255) NOT NULL,
    "paymentLocation" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carriers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "fantasyName" TEXT NOT NULL,
    "representative" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_types" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "clientSystemTypeId" INTEGER NOT NULL,
    "clientDescriptionTypeId" INTEGER NOT NULL,
    "clientDriveTypeId" INTEGER NOT NULL,
    "clientAddressId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_system_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_system_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_description_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_description_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_drive_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_drive_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "parentClientId" INTEGER,
    "isSubClient" BOOLEAN NOT NULL DEFAULT false,
    "document" TEXT NOT NULL,
    "ie" TEXT,
    "groupId" INTEGER NOT NULL,
    "resaleId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "attendanceId" INTEGER,
    "maintenanceTicketId" INTEGER,
    "honorificId" INTEGER,
    "companyName" TEXT NOT NULL,
    "fantasyName" TEXT,
    "socialName" TEXT,
    "domain" TEXT,
    "headquarters" TEXT NOT NULL,
    "invoiceType" TEXT NOT NULL,
    "generateInvoice" BOOLEAN NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_attendances" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_maintenance_tickets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_maintenance_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_attachments" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_owners" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contacts" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "observations" TEXT,
    "receiveNF" BOOLEAN NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_addresses" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "cityCodeIbge" VARCHAR(7),
    "state" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_items" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitValueInCents" INTEGER NOT NULL,
    "cnaeNbsIndopId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_invoice_configs" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "generateNf" BOOLEAN NOT NULL,
    "type" TEXT NOT NULL,
    "emissionDay" INTEGER NOT NULL,
    "dueDateType" TEXT NOT NULL,
    "dueDateDay" INTEGER,
    "dueMonth" INTEGER,
    "deadlineDays" INTEGER,
    "months" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "billingAddressId" INTEGER NOT NULL,
    "bankId" INTEGER NOT NULL,
    "autoProtestBoleto" BOOLEAN NOT NULL,
    "issWithheld" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_invoice_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_discounts" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "doNotGenerateCharge" BOOLEAN NOT NULL,
    "terminateContract" BOOLEAN NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "fantasyName" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "ie" TEXT,
    "active" BOOLEAN NOT NULL,
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "phone01" TEXT NOT NULL,
    "phone02" TEXT,
    "cellphone" TEXT,
    "email01" TEXT NOT NULL,
    "email02" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billeds" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "isJunction" BOOLEAN NOT NULL,
    "installmentDays" INTEGER[],
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_terms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freights" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "honorifics" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "honorifics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_validities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_validities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_sequences" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "next_id" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resale_sequences" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "next_id" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resale_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfms" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "clientDocument" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "referenceMonth" INTEGER NOT NULL,
    "referenceYear" INTEGER NOT NULL,
    "totalValueInCents" INTEGER NOT NULL,
    "cnaeNbsIndopId" INTEGER NOT NULL,
    "nfseId" INTEGER,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfm_cron_runs" (
    "id" SERIAL NOT NULL,
    "createdCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "errors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfm_cron_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfs_provider_configs" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "vendor" TEXT NOT NULL,
    "municipalRegistration" TEXT NOT NULL,
    "municipalCodeIbge" TEXT NOT NULL,
    "serieRps" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "certFilePath" TEXT NOT NULL,
    "certPasswordEnvVar" TEXT NOT NULL,
    "vendorConfig" JSONB NOT NULL,
    "simpleNationalOptant" BOOLEAN NOT NULL DEFAULT false,
    "fiscalIncentive" BOOLEAN NOT NULL DEFAULT false,
    "issRate" DECIMAL(7,4),
    "issExigibility" INTEGER NOT NULL DEFAULT 1,
    "municipalTaxCode" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfs_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfses" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "rpsNumber" INTEGER NOT NULL,
    "rpsSeries" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "batchProtocol" TEXT,
    "nfseNumber" TEXT,
    "verificationCode" TEXT,
    "issuedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "canceledAt" TIMESTAMP(3),
    "cancelReasonCode" INTEGER,
    "bankPaymentProvider" TEXT,
    "bankPaymentRequestCode" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfse_rps_sequences" (
    "company_id" INTEGER NOT NULL,
    "next_id" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfse_rps_sequences_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "provider_items" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "totalValueInCents" INTEGER NOT NULL,
    "installmentsCount" INTEGER NOT NULL,
    "scheduleType" TEXT NOT NULL,
    "intervalDays" INTEGER,
    "dueDay" INTEGER,
    "firstDueDate" DATE NOT NULL,
    "bankId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_item_installments" (
    "id" SERIAL NOT NULL,
    "providerItemId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "valueInCents" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_item_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "fantasyName" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "ie" TEXT,
    "email" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resales" (
    "id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT,
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "ie" TEXT,
    "phone01" TEXT NOT NULL,
    "phone02" TEXT,
    "voucher" TEXT,
    "email" TEXT,
    "website" TEXT,
    "nickname" TEXT,
    "socialName" TEXT,
    "validityDate" TIMESTAMP(3),
    "accessEmail" TEXT,
    "accessPassword" TEXT,
    "paymentDay" INTEGER,
    "bonus" INTEGER,
    "billingStartDay" INTEGER,
    "receivesSupportEmail" BOOLEAN NOT NULL DEFAULT false,
    "servedByRoot" BOOLEAN NOT NULL DEFAULT false,
    "manufacturerResale" BOOLEAN NOT NULL DEFAULT false,
    "indicatorResale" BOOLEAN NOT NULL DEFAULT false,
    "recurringResale" BOOLEAN NOT NULL DEFAULT false,
    "profilePictureUrl" TEXT,
    "honorificId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resale_contacts" (
    "id" SERIAL NOT NULL,
    "resaleId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "observations" TEXT,
    "receiveNF" BOOLEAN NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resale_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sellers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nickname" TEXT,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL,
    "profilePictureUrl" TEXT,
    "observation" TEXT,
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "cnaeNbsIndopId" INTEGER NOT NULL,
    "billedId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "deliveryTermId" INTEGER NOT NULL,
    "freightId" INTEGER NOT NULL,
    "proposalValidityId" INTEGER NOT NULL,
    "warrantyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unitPriceInCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "isCommercial" BOOLEAN NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_attendance_values" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "values" JSONB NOT NULL,
    "totalValueInCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_attendance_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cnaes" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cnaes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nbss" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nbss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indops" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cnae_nbs_indops" (
    "id" SERIAL NOT NULL,
    "cnaeId" INTEGER NOT NULL,
    "nbsId" INTEGER NOT NULL,
    "indopId" INTEGER NOT NULL,
    "serviceListItemCode" VARCHAR(10),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cnae_nbs_indops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "texts" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "texts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CompanyToService" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_id_role_key" ON "accounts"("id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "account_claims_accountId_subject_action_key" ON "account_claims"("accountId", "subject", "action");

-- CreateIndex
CREATE UNIQUE INDEX "admins_accountId_key" ON "admins"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_document_key" ON "admins"("document");

-- CreateIndex
CREATE UNIQUE INDEX "banks_bankCode_agency_account_key" ON "banks"("bankCode", "agency", "account");

-- CreateIndex
CREATE UNIQUE INDEX "carriers_document_key" ON "carriers"("document");

-- CreateIndex
CREATE UNIQUE INDEX "client_system_types_name_key" ON "client_system_types"("name");

-- CreateIndex
CREATE INDEX "client_system_types_imageUrl_idx" ON "client_system_types"("imageUrl");

-- CreateIndex
CREATE UNIQUE INDEX "client_description_types_name_key" ON "client_description_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "client_drive_types_name_key" ON "client_drive_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "client_attendances_name_key" ON "client_attendances"("name");

-- CreateIndex
CREATE UNIQUE INDEX "client_maintenance_tickets_name_key" ON "client_maintenance_tickets"("name");

-- CreateIndex
CREATE INDEX "client_attachments_link_idx" ON "client_attachments"("link");

-- CreateIndex
CREATE UNIQUE INDEX "client_groups_name_key" ON "client_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "client_owners_name_key" ON "client_owners"("name");

-- CreateIndex
CREATE UNIQUE INDEX "client_contacts_clientId_email_key" ON "client_contacts"("clientId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "client_addresses_clientId_type_key" ON "client_addresses"("clientId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "client_invoice_configs_clientId_key" ON "client_invoice_configs"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_document_key" ON "companies"("document");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_terms_name_key" ON "delivery_terms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "freights_name_key" ON "freights"("name");

-- CreateIndex
CREATE UNIQUE INDEX "honorifics_name_key" ON "honorifics"("name");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_validities_name_key" ON "proposal_validities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "warranties_name_key" ON "warranties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "nfms_nfseId_key" ON "nfms"("nfseId");

-- CreateIndex
CREATE UNIQUE INDEX "nfms_clientId_referenceMonth_referenceYear_cnaeNbsIndopId_key" ON "nfms"("clientId", "referenceMonth", "referenceYear", "cnaeNbsIndopId");

-- CreateIndex
CREATE UNIQUE INDEX "nfs_provider_configs_companyId_key" ON "nfs_provider_configs"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "nfses_companyId_rpsSeries_rpsNumber_key" ON "nfses"("companyId", "rpsSeries", "rpsNumber");

-- CreateIndex
CREATE UNIQUE INDEX "provider_item_installments_providerItemId_number_key" ON "provider_item_installments"("providerItemId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "providers_document_key" ON "providers"("document");

-- CreateIndex
CREATE UNIQUE INDEX "providers_email_key" ON "providers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "resale_contacts_resaleId_email_key" ON "resale_contacts"("resaleId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_email_key" ON "sellers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cnaes_code_key" ON "cnaes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "nbss_code_key" ON "nbss"("code");

-- CreateIndex
CREATE UNIQUE INDEX "indops_code_key" ON "indops"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cnae_nbs_indops_cnaeId_nbsId_indopId_key" ON "cnae_nbs_indops"("cnaeId", "nbsId", "indopId");

-- CreateIndex
CREATE UNIQUE INDEX "texts_type_key" ON "texts"("type");

-- CreateIndex
CREATE UNIQUE INDEX "_CompanyToService_AB_unique" ON "_CompanyToService"("A", "B");

-- CreateIndex
CREATE INDEX "_CompanyToService_B_index" ON "_CompanyToService"("B");

-- AddForeignKey
ALTER TABLE "account_claims" ADD CONSTRAINT "account_claims_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_types" ADD CONSTRAINT "client_types_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_types" ADD CONSTRAINT "client_types_clientSystemTypeId_fkey" FOREIGN KEY ("clientSystemTypeId") REFERENCES "client_system_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_types" ADD CONSTRAINT "client_types_clientDescriptionTypeId_fkey" FOREIGN KEY ("clientDescriptionTypeId") REFERENCES "client_description_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_types" ADD CONSTRAINT "client_types_clientDriveTypeId_fkey" FOREIGN KEY ("clientDriveTypeId") REFERENCES "client_drive_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_types" ADD CONSTRAINT "client_types_clientAddressId_fkey" FOREIGN KEY ("clientAddressId") REFERENCES "client_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_parentClientId_fkey" FOREIGN KEY ("parentClientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "client_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_resaleId_fkey" FOREIGN KEY ("resaleId") REFERENCES "resales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "client_attendances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_maintenanceTicketId_fkey" FOREIGN KEY ("maintenanceTicketId") REFERENCES "client_maintenance_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_honorificId_fkey" FOREIGN KEY ("honorificId") REFERENCES "honorifics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_attachments" ADD CONSTRAINT "client_attachments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_addresses" ADD CONSTRAINT "client_addresses_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_items" ADD CONSTRAINT "client_items_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_items" ADD CONSTRAINT "client_items_cnaeNbsIndopId_fkey" FOREIGN KEY ("cnaeNbsIndopId") REFERENCES "cnae_nbs_indops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_invoice_configs" ADD CONSTRAINT "client_invoice_configs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_invoice_configs" ADD CONSTRAINT "client_invoice_configs_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "client_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_invoice_configs" ADD CONSTRAINT "client_invoice_configs_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_discounts" ADD CONSTRAINT "client_discounts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfms" ADD CONSTRAINT "nfms_cnaeNbsIndopId_fkey" FOREIGN KEY ("cnaeNbsIndopId") REFERENCES "cnae_nbs_indops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfms" ADD CONSTRAINT "nfms_nfseId_fkey" FOREIGN KEY ("nfseId") REFERENCES "nfses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfs_provider_configs" ADD CONSTRAINT "nfs_provider_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_items" ADD CONSTRAINT "provider_items_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_items" ADD CONSTRAINT "provider_items_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_item_installments" ADD CONSTRAINT "provider_item_installments_providerItemId_fkey" FOREIGN KEY ("providerItemId") REFERENCES "provider_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resales" ADD CONSTRAINT "resales_honorificId_fkey" FOREIGN KEY ("honorificId") REFERENCES "honorifics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resale_contacts" ADD CONSTRAINT "resale_contacts_resaleId_fkey" FOREIGN KEY ("resaleId") REFERENCES "resales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resale_contacts" ADD CONSTRAINT "resale_contacts_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_cnaeNbsIndopId_fkey" FOREIGN KEY ("cnaeNbsIndopId") REFERENCES "cnae_nbs_indops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_billedId_fkey" FOREIGN KEY ("billedId") REFERENCES "billeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_deliveryTermId_fkey" FOREIGN KEY ("deliveryTermId") REFERENCES "delivery_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_freightId_fkey" FOREIGN KEY ("freightId") REFERENCES "freights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_proposalValidityId_fkey" FOREIGN KEY ("proposalValidityId") REFERENCES "proposal_validities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_warrantyId_fkey" FOREIGN KEY ("warrantyId") REFERENCES "warranties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_attendance_values" ADD CONSTRAINT "service_attendance_values_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnae_nbs_indops" ADD CONSTRAINT "cnae_nbs_indops_cnaeId_fkey" FOREIGN KEY ("cnaeId") REFERENCES "cnaes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnae_nbs_indops" ADD CONSTRAINT "cnae_nbs_indops_nbsId_fkey" FOREIGN KEY ("nbsId") REFERENCES "nbss"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnae_nbs_indops" ADD CONSTRAINT "cnae_nbs_indops_indopId_fkey" FOREIGN KEY ("indopId") REFERENCES "indops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToService" ADD CONSTRAINT "_CompanyToService_A_fkey" FOREIGN KEY ("A") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToService" ADD CONSTRAINT "_CompanyToService_B_fkey" FOREIGN KEY ("B") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

