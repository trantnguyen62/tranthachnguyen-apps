-- Migration: Add AcmeAccount table for ACME/Let's Encrypt account persistence
-- Run this on LXC 203 PostgreSQL

-- Create the AcmeAccount table
CREATE TABLE IF NOT EXISTS "AcmeAccount" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "accountUrl" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcmeAccount_pkey" PRIMARY KEY ("id")
);

-- Create unique index on environment (only one account per environment)
CREATE UNIQUE INDEX IF NOT EXISTS "AcmeAccount_environment_key" ON "AcmeAccount"("environment");

-- Verify the table was created
SELECT 'AcmeAccount table created successfully' AS status;
