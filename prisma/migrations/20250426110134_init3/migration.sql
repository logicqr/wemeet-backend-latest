/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `LeaveRequest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `allowedRadius` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `officeLatitude` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `officeLongitude` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Attendance_user_id_key";

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "report" TEXT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "allowedRadius" INTEGER NOT NULL,
ADD COLUMN     "officeLatitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "officeLongitude" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT,
ADD COLUMN     "employee_id" TEXT,
ADD COLUMN     "mode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LeaveRequest_user_id_key" ON "LeaveRequest"("user_id");
