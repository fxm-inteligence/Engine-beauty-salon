import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

export class PatchTreatmentRequestDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  minutes?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  price?: number;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
