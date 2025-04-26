/*
  Warnings:

  - A unique constraint covering the columns `[company_id]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Company_company_id_key" ON "Company"("company_id");
