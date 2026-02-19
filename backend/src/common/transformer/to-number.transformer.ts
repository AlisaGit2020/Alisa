/**
 * Class-transformer helper that converts values to numbers.
 * Handles empty strings, null, undefined, and NaN by returning a default value.
 *
 * @param defaultValue The value to return if the input cannot be converted to a valid number
 * @returns A transformer function for use with @Transform decorator
 *
 * @example
 * class MyDto {
 *   @Transform(toNumber(0))
 *   amount: number = 0;
 *
 *   @Transform(toNumber(1))
 *   quantity: number = 1;
 * }
 */
export const toNumber =
  (defaultValue: number) =>
  ({ value }: { value: unknown }) => {
    if (value === '' || value === null || value === undefined) {
      return defaultValue;
    }
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };
