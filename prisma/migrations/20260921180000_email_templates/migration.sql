-- Templates de e-mail (HTML + CSS + assunto) e catálogo de variáveis interpoláveis.

CREATE TABLE "email_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "subject" VARCHAR(255) NOT NULL,
    "html" TEXT NOT NULL,
    "css" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_templates_name_key" ON "email_templates"("name");

CREATE TABLE "email_template_variables" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(128) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "example" VARCHAR(1024),
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_template_variables_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_template_variables_key_key" ON "email_template_variables"("key");
