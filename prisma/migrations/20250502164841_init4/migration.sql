/*
  Warnings:

  - Added the required column `isActive` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "isActive" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "TempOrder" (
    "temp_id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TempOrder_pkey" PRIMARY KEY ("temp_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TempOrder_email_key" ON "TempOrder"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TempOrder_razorpayOrderId_key" ON "TempOrder"("razorpayOrderId");
