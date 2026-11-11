import { BookingAuditLogRepository } from "./booking-audit-log-repository.repository";
import { BookingRepository } from "./booking-repository.repository";
import { BookingServiceController } from "./booking-service.controller";
import { BookingService } from "./booking-service.service";
import { BookingStatusLogRepository } from "./booking-status-log-repository.repository";
import { TelegramChatter } from "./telegram-chatter.integration";
import { Module } from "@nestjs/common";

@Module({
  controllers: [BookingServiceController],
  providers: [BookingService, BookingRepository, BookingStatusLogRepository, BookingAuditLogRepository, TelegramChatter],
})
export class BookingServiceModule {}
