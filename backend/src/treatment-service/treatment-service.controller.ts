import { TOTAL_COUNT_HEADER, parseListQuery } from "../list-query";
import { AdminKeyGuard } from "./admin-key.guard";
import { CreateTreatmentRequestDto } from "./dto/create-treatment-request.dto";
import { PatchTreatmentRequestDto } from "./dto/patch-treatment-request.dto";
import { UpdateTreatmentRequestDto } from "./dto/update-treatment-request.dto";
import { TreatmentService } from "./treatment-service.service";
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";

@ApiTags("TreatmentService")
@Controller()
export class TreatmentServiceController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Get("/treatments")
  async listTreatments(@Query() query: Record<string, unknown>, @Res({ passthrough: true }) response: Response) {
    const page = await this.treatmentService.listTreatments(parseListQuery(query));
    response.setHeader(TOTAL_COUNT_HEADER, page.total);
    return page.items;
  }

  @Get("/treatments/:id")
  getTreatment(@Param("id") id: string) {
    return this.treatmentService.getTreatment(id);
  }

  @UseGuards(AdminKeyGuard)
  @Post("/treatments")
  createTreatment(@Body() dto: CreateTreatmentRequestDto) {
    return this.treatmentService.createTreatment(dto);
  }

  @UseGuards(AdminKeyGuard)
  @Put("/treatments/:id")
  updateTreatment(@Param("id") id: string, @Body() dto: UpdateTreatmentRequestDto) {
    return this.treatmentService.updateTreatment(id, dto);
  }

  @UseGuards(AdminKeyGuard)
  @Patch("/treatments/:id")
  patchTreatment(@Param("id") id: string, @Body() dto: PatchTreatmentRequestDto) {
    return this.treatmentService.patchTreatment(id, dto);
  }

  @UseGuards(AdminKeyGuard)
  @Delete("/treatments/:id")
  deleteTreatment(@Param("id") id: string) {
    return this.treatmentService.deleteTreatment(id);
  }
}
