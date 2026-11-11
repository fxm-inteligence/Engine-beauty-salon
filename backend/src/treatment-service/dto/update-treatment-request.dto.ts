import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateTreatmentRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  name: string;

  @ApiProperty({ type: Number })
  @IsInt()
  minutes: number;

  @ApiProperty({ type: Number })
  @IsInt()
  price: number;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
