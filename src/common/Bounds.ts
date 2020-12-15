import { Type } from "class-transformer";
import { Max, Min } from "class-validator";

export class BoundsDto {
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  north = 90;

  @Type(() => Number)
  @Min(-180)
  @Max(180)
  east = 180;

  @Type(() => Number)
  @Min(-90)
  @Max(90)
  south = -90;

  @Type(() => Number)
  @Min(-180)
  @Max(180)
  west = -180;
}
