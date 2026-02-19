import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator that checks if a value is a valid Date object.
 * Unlike @IsDate(), this validator returns false for Invalid Date objects
 * (where getTime() returns NaN).
 *
 * Use with @IsOptional() to allow undefined/null values.
 */
export function IsValidDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          // Allow undefined/null (use @IsOptional() to allow these)
          if (value === undefined || value === null) {
            return true;
          }

          // Must be a Date object
          if (!(value instanceof Date)) {
            return false;
          }

          // Check if it's a valid date (not NaN)
          return !isNaN(value.getTime());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid date`;
        },
      },
    });
  };
}
