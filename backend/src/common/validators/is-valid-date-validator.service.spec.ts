import { validate } from 'class-validator';
import { IsValidDate } from './is-valid-date.validator';

class TestDto {
  @IsValidDate()
  date?: Date;
}

describe('IsValidDate validator', () => {
  it('should pass for valid date', async () => {
    const dto = new TestDto();
    dto.date = new Date('2024-01-15');

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass for undefined value', async () => {
    const dto = new TestDto();
    dto.date = undefined;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass for null value', async () => {
    const dto = new TestDto();
    dto.date = null as unknown as Date;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail for invalid date (NaN)', async () => {
    const dto = new TestDto();
    dto.date = new Date('Invalid Date');

    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isValidDate).toContain('must be a valid date');
  });

  it('should fail for non-Date value', async () => {
    const dto = new TestDto();
    dto.date = 'not a date' as unknown as Date;

    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isValidDate).toContain('must be a valid date');
  });

  it('should fail for date created from 00/00/0000', async () => {
    const dto = new TestDto();
    // Date constructor with 0/0/0 creates invalid date in some contexts
    dto.date = new Date('0000-00-00');

    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isValidDate).toContain('must be a valid date');
  });
});
