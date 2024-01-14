import { ValueTransformer } from 'typeorm';

export class DecimalToNumberTransformer implements ValueTransformer {
  to(value: number): number {
    return value;
  }

  from(value: string): number {
    return parseFloat(value);
  }
}
