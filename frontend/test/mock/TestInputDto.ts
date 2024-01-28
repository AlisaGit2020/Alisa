import { IsNotEmpty, IsNumber, Max, Min } from "class-validator";
export class TestInputDto {
    @IsNotEmpty()
    name: string;
}

