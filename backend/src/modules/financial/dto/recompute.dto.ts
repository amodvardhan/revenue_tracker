import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches } from "class-validator";

const YEAR_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export class RecomputeDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @Matches(YEAR_MONTH_REGEX, { message: "month must match YYYY-MM" })
  month!: string;
}
