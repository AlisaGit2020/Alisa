import { ColumnOptions } from "typeorm";
import { DecimalToNumberTransformer } from "./transformer/entity.data.transformer";

export const columnOptionOneDecimal: ColumnOptions = getDecimalColumnOption(1)
export const columnOptionTwoDecimal: ColumnOptions = getDecimalColumnOption(2)

function getDecimalColumnOption(scale: number): ColumnOptions {
    return {
        type: 'decimal',
        precision: 10,
        scale: scale,
        default: 0,
        transformer: new DecimalToNumberTransformer()
    }
}