/*
  Warnings:

  - A unique constraint covering the columns `[temp_id]` on the table `TempOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TempOrder_temp_id_key" ON "TempOrder"("temp_id");
