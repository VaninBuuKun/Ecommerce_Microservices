CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE TABLE "Categories" (
        "Id" uuid NOT NULL,
        "Name" character varying(255) NOT NULL,
        "Description" character varying(1000) NOT NULL,
        "ParentId" uuid,
        "IconUrl" text,
        "IsActive" boolean NOT NULL,
        "CreatedDate" timestamp with time zone NOT NULL,
        "LastModifiedDate" timestamp with time zone,
        CONSTRAINT "PK_Categories" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Categories_Categories_ParentId" FOREIGN KEY ("ParentId") REFERENCES "Categories" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE TABLE "Products" (
        "Id" uuid NOT NULL,
        "ShopId" bigint NOT NULL,
        "Name" text NOT NULL,
        "Description" text NOT NULL,
        "Status" character varying(20) NOT NULL,
        "Weight" double precision NOT NULL DEFAULT 0.0,
        "Length" double precision NOT NULL DEFAULT 0.0,
        "Width" double precision NOT NULL DEFAULT 0.0,
        "Height" double precision NOT NULL DEFAULT 0.0,
        "ThumbnailUrl" character varying(1000),
        "VideoUrl" character varying(1000),
        "ImageUrls" json NOT NULL,
        "CategoryId" uuid,
        "Price" numeric(18,2) NOT NULL DEFAULT 0.0,
        "DiscountPrice" numeric(18,2) NOT NULL DEFAULT 0.0,
        "AvailableStock" integer NOT NULL DEFAULT 0,
        "AverageRating" double precision NOT NULL,
        "ReviewCount" integer NOT NULL,
        "RatingSum" integer NOT NULL,
        CONSTRAINT "PK_Products" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Products_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE TABLE "ProductOptions" (
        "Id" uuid NOT NULL,
        "ProductId" uuid NOT NULL,
        "Name" character varying(255) NOT NULL,
        "SortOrder" integer NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedDate" timestamp with time zone NOT NULL,
        "LastModifiedDate" timestamp with time zone,
        CONSTRAINT "PK_ProductOptions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ProductOptions_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE TABLE "ProductReviews" (
        "Id" uuid NOT NULL,
        "ProductId" uuid NOT NULL,
        "CustomerId" bigint NOT NULL,
        "Rating" integer NOT NULL,
        "Comment" character varying(2000) NOT NULL,
        "CreatedDate" timestamp with time zone NOT NULL,
        "Media" json NOT NULL,
        "LastModifiedDate" timestamp with time zone,
        CONSTRAINT "PK_ProductReviews" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ProductReviews_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE TABLE "ProductVariants" (
        "Id" uuid NOT NULL,
        "ProductId" uuid NOT NULL,
        "Price" numeric(18,2) NOT NULL,
        "AvailableStocks" integer NOT NULL,
        "ReservedStocks" integer NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "Weight" double precision,
        "Length" double precision,
        "Width" double precision,
        "Height" double precision,
        "DiscountPrice" numeric NOT NULL,
        "CreatedDate" timestamp with time zone NOT NULL,
        "LastModifiedDate" timestamp with time zone,
        CONSTRAINT "PK_ProductVariants" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ProductVariants_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE TABLE "Wishlists" (
        "Id" uuid NOT NULL,
        "CustomerId" bigint NOT NULL,
        "ProductId" uuid NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "CreatedDate" timestamp with time zone NOT NULL,
        "LastModifiedDate" timestamp with time zone,
        CONSTRAINT "PK_Wishlists" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Wishlists_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE TABLE "ProductOptionValues" (
        "Id" uuid NOT NULL,
        "OptionId" uuid NOT NULL,
        "Value" character varying(255) NOT NULL,
        "ImageUrl" character varying(1000),
        "SortOrder" integer NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedDate" timestamp with time zone NOT NULL,
        "LastModifiedDate" timestamp with time zone,
        CONSTRAINT "PK_ProductOptionValues" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ProductOptionValues_ProductOptions_OptionId" FOREIGN KEY ("OptionId") REFERENCES "ProductOptions" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE TABLE "ProductVariantOptions" (
        "VariantId" uuid NOT NULL,
        "OptionValueId" uuid NOT NULL,
        CONSTRAINT "PK_ProductVariantOptions" PRIMARY KEY ("VariantId", "OptionValueId"),
        CONSTRAINT "FK_ProductVariantOptions_ProductOptionValues_OptionValueId" FOREIGN KEY ("OptionValueId") REFERENCES "ProductOptionValues" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_ProductVariantOptions_ProductVariants_VariantId" FOREIGN KEY ("VariantId") REFERENCES "ProductVariants" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE INDEX "IX_Categories_ParentId" ON "Categories" ("ParentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE INDEX "IX_ProductOptions_ProductId" ON "ProductOptions" ("ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE INDEX "IX_ProductOptionValues_OptionId" ON "ProductOptionValues" ("OptionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE INDEX "IX_ProductReviews_ProductId" ON "ProductReviews" ("ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE INDEX "IX_Products_CategoryId" ON "Products" ("CategoryId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE INDEX "IX_ProductVariantOptions_OptionValueId" ON "ProductVariantOptions" ("OptionValueId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE INDEX "IX_ProductVariants_ProductId" ON "ProductVariants" ("ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE UNIQUE INDEX "IX_Wishlists_CustomerId_ProductId" ON "Wishlists" ("CustomerId", "ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    CREATE INDEX "IX_Wishlists_ProductId" ON "Wishlists" ("ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260823151614_InitialCatalogPostgres') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260823151614_InitialCatalogPostgres', '9.0.16');
    END IF;
END $EF$;
COMMIT;

