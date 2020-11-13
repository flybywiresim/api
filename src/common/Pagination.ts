import { Type } from "class-transformer";
import { IsInt, IsPositive, Max, Min } from "class-validator";

export class PaginationDto {
    @Type(() => Number)
    @IsPositive()
    @IsInt()
    @Max(100)
    take = 25;

    @Type(() => Number)
    @Min(0)
    @IsInt()
    skip = 0;
}
