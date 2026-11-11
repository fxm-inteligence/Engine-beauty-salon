import { TreatmentRepository } from "./treatment-repository.repository";
import { TreatmentServiceController } from "./treatment-service.controller";
import { TreatmentService } from "./treatment-service.service";
import { Module } from "@nestjs/common";

@Module({
  controllers: [TreatmentServiceController],
  providers: [TreatmentService, TreatmentRepository],
})
export class TreatmentServiceModule {}
