-- Migration: Add passwordHash column to users table for standalone auth
-- This allows users to register with email/password instead of relying on Manus OAuth

ALTER TABLE `users` ADD COLUMN `passwordHash` TEXT;
