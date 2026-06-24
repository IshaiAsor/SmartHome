-- AlterTable
ALTER TABLE "user_devices" ADD COLUMN "pending_device_type_id" INTEGER,
ADD COLUMN "pending_firmware_version" VARCHAR(64);

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_pending_device_type_id_fkey" FOREIGN KEY ("pending_device_type_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
