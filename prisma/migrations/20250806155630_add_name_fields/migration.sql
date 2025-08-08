/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firstName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT 'Usuário';
ALTER TABLE "users" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT 'Genérico';

-- CreateIndex
--CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");


