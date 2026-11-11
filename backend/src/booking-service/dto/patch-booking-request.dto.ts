import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

export class PatchBookingRequestDto {
  @ApiPropertyOptional({ type: String, format: "uuid" })
  @IsOptional()
  @IsUUID()
  treatmentId?: string;

  @ApiPropertyOptional({ type: String, format: "uuid" })
  @IsOptional()
  @IsUUID()
  masterId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  clientTelegramId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  reminded?: boolean;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
