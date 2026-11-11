import { ListQuery } from "../list-query";
import { withHooks } from "../with-hooks";
import { CreateTreatmentRequestDto } from "./dto/create-treatment-request.dto";
import { PatchTreatmentRequestDto } from "./dto/patch-treatment-request.dto";
import { UpdateTreatmentRequestDto } from "./dto/update-treatment-request.dto";
import { TreatmentRepository } from "./treatment-repository.repository";
import { hooks } from "./treatment-service.hooks";
import { lockSlots, logicHooks } from "./treatment-service.logic";
import { Injectable, NotFoundException } from "@nestjs/common";

@Injectable()
export class TreatmentService {
  constructor(private readonly treatmentRepository: TreatmentRepository) {}

  listTreatments(query: ListQuery) {
    return this.treatmentRepository.findPage(query);
  }

  async getTreatment(id: string) {
    const record = await this.treatmentRepository.findById(id);
    if (!record) throw new NotFoundException();
    return record;
  }

  createTreatment(dto: CreateTreatmentRequestDto) {
    return this.treatmentRepository.create({ ...dto, createdAt: dto.createdAt === undefined ? undefined : new Date(dto.createdAt) });
  }

  async updateTreatment(id: string, dto: UpdateTreatmentRequestDto) {
    const record = await this.treatmentRepository.findById(id);
    if (!record) throw new NotFoundException();
    return this.treatmentRepository.update(id, { ...dto, createdAt: dto.createdAt === undefined ? undefined : new Date(dto.createdAt) });
  }

  async patchTreatment(id: string, dto: PatchTreatmentRequestDto) {
    const record = await this.treatmentRepository.findById(id);
    if (!record) throw new NotFoundException();
    return this.treatmentRepository.update(id, { ...dto, createdAt: dto.createdAt === undefined ? undefined : new Date(dto.createdAt) });
  }

  async deleteTreatment(id: string) {
    const record = await this.treatmentRepository.findById(id);
    if (!record) throw new NotFoundException();
    return this.treatmentRepository.remove(id);
  }
}

withHooks(TreatmentService.prototype, hooks);
withHooks(TreatmentService.prototype, logicHooks);
lockSlots(TreatmentService.prototype);
