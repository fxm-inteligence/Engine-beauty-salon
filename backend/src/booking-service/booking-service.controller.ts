import { TOTAL_COUNT_HEADER, parseListQuery } from "../list-query";
import { AdminKeyGuard } from "./admin-key.guard";
import { BookingService } from "./booking-service.service";
import { CreateBookingRequestDto } from "./dto/create-booking-request.dto";
import { PatchBookingRequestDto } from "./dto/patch-booking-request.dto";
import { UpdateBookingRequestDto } from "./dto/update-booking-request.dto";
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";

@ApiTags("BookingService")
@Controller()
export class BookingServiceController {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(AdminKeyGuard)
  @Get("/bookings")
  async listBookings(@Query() query: Record<string, unknown>, @Res({ passthrough: true }) response: Response) {
    const page = await this.bookingService.listBookings(parseListQuery(query));
    response.setHeader(TOTAL_COUNT_HEADER, page.total);
    return page.items;
  }

  @UseGuards(AdminKeyGuard)
  @Get("/bookings/busy")
  getBookingBusy() {
    return this.bookingService.getBookingBusy();
  }

  @UseGuards(AdminKeyGuard)
  @Get("/bookings/free")
  async getBookingFree(@Query() query: Record<string, unknown>, @Res({ passthrough: true }) response: Response) {
    const page = await this.bookingService.getBookingFree(parseListQuery(query));
    response.setHeader(TOTAL_COUNT_HEADER, page.total);
    return page.items;
  }

  @UseGuards(AdminKeyGuard)
  @Get("/bookings/:id")
  getBooking(@Param("id") id: string) {
    return this.bookingService.getBooking(id);
  }

  @Post("/bookings")
  createBooking(@Body() dto: CreateBookingRequestDto) {
    return this.bookingService.createBooking(dto);
  }

  @UseGuards(AdminKeyGuard)
  @Put("/bookings/:id")
  updateBooking(@Param("id") id: string, @Body() dto: UpdateBookingRequestDto) {
    return this.bookingService.updateBooking(id, dto);
  }

  @UseGuards(AdminKeyGuard)
  @Patch("/bookings/:id")
  patchBooking(@Param("id") id: string, @Body() dto: PatchBookingRequestDto) {
    return this.bookingService.patchBooking(id, dto);
  }

  @UseGuards(AdminKeyGuard)
  @Delete("/bookings/:id")
  deleteBooking(@Param("id") id: string) {
    return this.bookingService.deleteBooking(id);
  }

  @UseGuards(AdminKeyGuard)
  @Get("/bookings/:id/transitions")
  getBookingTransitions(@Param("id") id: string) {
    return this.bookingService.getBookingTransitions(id);
  }
}
