import { ColumnOptions } from "typeorm";
import { DecimalToNumberTransformer } from "./transformer/entity.data.transformer";

export const columnOptionTwoDecimal: ColumnOptions = {
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new DecimalToNumberTransformer()
};