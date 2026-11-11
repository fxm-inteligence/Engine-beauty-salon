import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateMasterRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  name: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  hours?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  daysOff?: string;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
