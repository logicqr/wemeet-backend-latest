/*
  Warnings:

  - You are about to drop the column `plan` on the `Plans` table. All the data in the column will be lost.
  - Added the required column `billingCycle` to the `Plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationInDays` to the `Plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endSubscriptionDate` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- DropIndex
DROP INDEX "Plans_plan_key";

-- AlterTable
ALTER TABLE "Plans" DROP COLUMN "plan",
ADD COLUMN     "billingCycle" "BillingCycle" NOT NULL,
ADD COLUMN     "durationInDays" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "endSubscriptionDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "tempStatus" TEXT NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "isActive" SET DEFAULT false;

-- DropEnum
DROP TYPE "SubscriptionPlan";
