import { IsNotEmpty, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
import { TestChildInputDto } from "./TestChildInputDto";


export class TestNestedInputDto {
    @IsNotEmpty()
    name!: string;
    
    @ValidateNested({ each: true })    
    @Type(() => TestChildInputDto)
    child: TestChildInputDto = new TestChildInputDto()
}

