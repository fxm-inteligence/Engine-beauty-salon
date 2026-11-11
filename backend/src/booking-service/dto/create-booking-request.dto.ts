import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateBookingRequestDto {
  @ApiProperty({ type: String, format: "uuid" })
  @IsUUID()
  treatmentId: string;

  @ApiProperty({ type: String, format: "uuid" })
  @IsUUID()
  masterId: string;

  @ApiProperty({ type: String })
  @IsString()
  clientName: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ type: String, format: "date-time" })
  @IsDateString()
  startsAt: string;

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
