import { IsNotEmpty } from "class-validator";
export class TestInputDto {
    @IsNotEmpty()
    name!: string;
}

