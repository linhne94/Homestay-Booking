-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'RECEPTIONIST', 'HOUSEKEEPER');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MOMO', 'VNPAY', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'FULL', 'FINAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARNED', 'USED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "OtaSyncStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "BRANCH" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "thumbnail_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BRANCH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ROOM_TYPE" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "max_guests" INTEGER NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "deposit_rate" DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    "description" TEXT NOT NULL,
    "thumbnail_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ROOM_TYPE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ROOM" (
    "id" UUID NOT NULL,
    "room_type_id" UUID NOT NULL,
    "room_number" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ROOM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ROOM_IMAGE" (
    "id" UUID NOT NULL,
    "room_type_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ROOM_IMAGE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AMENITY" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "AMENITY_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ROOM_TYPE_AMENITY" (
    "room_type_id" UUID NOT NULL,
    "amenity_id" UUID NOT NULL,

    CONSTRAINT "ROOM_TYPE_AMENITY_pkey" PRIMARY KEY ("room_type_id","amenity_id")
);

-- CreateTable
CREATE TABLE "PRICE_OVERRIDE" (
    "id" UUID NOT NULL,
    "room_type_id" UUID NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "PRICE_OVERRIDE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PROMOTION" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discount_pct" DECIMAL(5,2),
    "discount_flat" DECIMAL(12,2),
    "max_discount" DECIMAL(12,2),
    "min_nights" INTEGER DEFAULT 1,
    "usage_limit" INTEGER,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PROMOTION_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOOKING_PROMOTION" (
    "booking_id" UUID NOT NULL,
    "promotion_id" UUID NOT NULL,
    "discount_applied" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "BOOKING_PROMOTION_pkey" PRIMARY KEY ("booking_id","promotion_id")
);

-- CreateTable
CREATE TABLE "BLACKOUT_DATE" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "BLACKOUT_DATE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CONTENT_TRANSLATION" (
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "lang_code" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "CONTENT_TRANSLATION_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "USER" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "preferred_lang" TEXT DEFAULT 'vi',
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "USER_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "STAFF" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'RECEPTIONIST',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "STAFF_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LOYALTY_TRANSACTION" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "booking_id" UUID,
    "points" INTEGER NOT NULL,
    "type" "LoyaltyTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LOYALTY_TRANSACTION_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NOTIFICATION" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "action_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NOTIFICATION_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOOKING" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "room_id" UUID NOT NULL,
    "check_in" DATE NOT NULL,
    "check_out" DATE NOT NULL,
    "num_guests" INTEGER NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "deposit_amount" DECIMAL(12,2) NOT NULL,
    "refund_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "source" TEXT NOT NULL DEFAULT 'direct',
    "loyalty_pts_used" INTEGER NOT NULL DEFAULT 0,
    "loyalty_pts_earned" INTEGER NOT NULL DEFAULT 0,
    "special_requests" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guest_name" TEXT,
    "guest_email" TEXT,
    "guest_phone" TEXT,
    "guest_token" TEXT,
    "token_expires_at" TIMESTAMP(3),

    CONSTRAINT "BOOKING_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PAYMENT" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "type" "PaymentType" NOT NULL DEFAULT 'FULL',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_ref" TEXT NOT NULL,
    "gateway_response" TEXT,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "PAYMENT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "REFUND" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "REFUND_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "REVIEW" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating_overall" INTEGER NOT NULL,
    "rating_cleanliness" INTEGER NOT NULL,
    "rating_service" INTEGER NOT NULL,
    "rating_location" INTEGER NOT NULL,
    "comment" TEXT,
    "staff_reply" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "REVIEW_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTA_CHANNEL" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "api_endpoint" TEXT,
    "api_key_hash" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OTA_CHANNEL_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTA_ROOM_MAPPING" (
    "id" UUID NOT NULL,
    "room_type_id" UUID NOT NULL,
    "ota_channel_id" UUID NOT NULL,
    "external_room_id" TEXT NOT NULL,
    "price_markup_pct" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "sync_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OTA_ROOM_MAPPING_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTA_SYNC_LOG" (
    "id" UUID NOT NULL,
    "ota_room_mapping_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "status" "OtaSyncStatus" NOT NULL,
    "payload" TEXT,
    "response" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTA_SYNC_LOG_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "REPORT_SNAPSHOT" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "total_revenue" DECIMAL(14,2) NOT NULL,
    "total_bookings" INTEGER NOT NULL,
    "total_guests" INTEGER NOT NULL,
    "avg_occupancy_rate" DECIMAL(5,2) NOT NULL,
    "avg_rating" DECIMAL(3,2) NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "REPORT_SNAPSHOT_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PROMOTION_code_key" ON "PROMOTION"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CONTENT_TRANSLATION_entity_type_entity_id_lang_code_field_n_key" ON "CONTENT_TRANSLATION"("entity_type", "entity_id", "lang_code", "field_name");

-- CreateIndex
CREATE UNIQUE INDEX "USER_email_key" ON "USER"("email");

-- CreateIndex
CREATE UNIQUE INDEX "STAFF_user_id_key" ON "STAFF"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "BOOKING_guest_token_key" ON "BOOKING"("guest_token");

-- CreateIndex
CREATE UNIQUE INDEX "PAYMENT_transaction_ref_key" ON "PAYMENT"("transaction_ref");

-- AddForeignKey
ALTER TABLE "ROOM_TYPE" ADD CONSTRAINT "ROOM_TYPE_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "BRANCH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROOM" ADD CONSTRAINT "ROOM_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "ROOM_TYPE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROOM_IMAGE" ADD CONSTRAINT "ROOM_IMAGE_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "ROOM_TYPE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROOM_TYPE_AMENITY" ADD CONSTRAINT "ROOM_TYPE_AMENITY_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "ROOM_TYPE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROOM_TYPE_AMENITY" ADD CONSTRAINT "ROOM_TYPE_AMENITY_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "AMENITY"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PRICE_OVERRIDE" ADD CONSTRAINT "PRICE_OVERRIDE_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "ROOM_TYPE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PROMOTION" ADD CONSTRAINT "PROMOTION_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "BRANCH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOOKING_PROMOTION" ADD CONSTRAINT "BOOKING_PROMOTION_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "BOOKING"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOOKING_PROMOTION" ADD CONSTRAINT "BOOKING_PROMOTION_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "PROMOTION"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLACKOUT_DATE" ADD CONSTRAINT "BLACKOUT_DATE_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "BRANCH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STAFF" ADD CONSTRAINT "STAFF_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STAFF" ADD CONSTRAINT "STAFF_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "BRANCH"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LOYALTY_TRANSACTION" ADD CONSTRAINT "LOYALTY_TRANSACTION_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LOYALTY_TRANSACTION" ADD CONSTRAINT "LOYALTY_TRANSACTION_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "BOOKING"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NOTIFICATION" ADD CONSTRAINT "NOTIFICATION_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOOKING" ADD CONSTRAINT "BOOKING_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "ROOM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOOKING" ADD CONSTRAINT "BOOKING_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PAYMENT" ADD CONSTRAINT "PAYMENT_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "BOOKING"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "REFUND" ADD CONSTRAINT "REFUND_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "PAYMENT"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "REFUND" ADD CONSTRAINT "REFUND_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "BOOKING"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "REVIEW" ADD CONSTRAINT "REVIEW_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "BOOKING"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "REVIEW" ADD CONSTRAINT "REVIEW_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTA_ROOM_MAPPING" ADD CONSTRAINT "OTA_ROOM_MAPPING_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "ROOM_TYPE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTA_ROOM_MAPPING" ADD CONSTRAINT "OTA_ROOM_MAPPING_ota_channel_id_fkey" FOREIGN KEY ("ota_channel_id") REFERENCES "OTA_CHANNEL"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTA_SYNC_LOG" ADD CONSTRAINT "OTA_SYNC_LOG_ota_room_mapping_id_fkey" FOREIGN KEY ("ota_room_mapping_id") REFERENCES "OTA_ROOM_MAPPING"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "REPORT_SNAPSHOT" ADD CONSTRAINT "REPORT_SNAPSHOT_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "BRANCH"("id") ON DELETE CASCADE ON UPDATE CASCADE;
