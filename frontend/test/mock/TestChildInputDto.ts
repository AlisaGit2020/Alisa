import { IsNotEmpty } from "class-validator";
export class TestChildInputDto {
    @IsNotEmpty()
    name!: string;
}

