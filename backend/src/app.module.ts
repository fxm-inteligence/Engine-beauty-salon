import { BookingAuditLogServiceModule } from "./booking-audit-log-service/booking-audit-log-service.module";
import { BookingServiceModule } from "./booking-service/booking-service.module";
import { BookingStatusLogServiceModule } from "./booking-status-log-service/booking-status-log-service.module";
import { MasterServiceModule } from "./master-service/master-service.module";
import { TreatmentServiceModule } from "./treatment-service/treatment-service.module";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: Number(process.env.RATE_LIMIT_MAX ?? 100) }]), TreatmentServiceModule, MasterServiceModule, BookingServiceModule, BookingStatusLogServiceModule, BookingAuditLogServiceModule],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
