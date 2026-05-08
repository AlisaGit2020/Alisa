import { extractValidationMessage, getFieldErrorProps } from './form-utils';
import { createAxiosError } from '@test-utils/test-data';

describe('getFieldErrorProps', () => {
  it('returns error=true and helperText when the field has an error', () => {
    expect(getFieldErrorProps({ name: 'required' }, 'name')).toEqual({
      error: true,
      helperText: 'required',
    });
  });

  it('returns error=false and undefined helperText when the field has no error', () => {
    expect(getFieldErrorProps({}, 'name')).toEqual({
      error: false,
      helperText: undefined,
    });
  });
});

describe('extractValidationMessage', () => {
  it('returns the message string from a single-message backend response', () => {
    const err = createAxiosError(400, ['size must not be greater than 1000']);
    expect(extractValidationMessage(err)).toBe('size must not be greater than 1000');
  });

  it('joins multiple messages with a period', () => {
    const err = createAxiosError(400, ['a is required', 'a must be a number']);
    expect(extractValidationMessage(err)).toBe('a is required. a must be a number');
  });

  it('returns null for non-axios errors', () => {
    expect(extractValidationMessage(new Error('boom'))).toBeNull();
  });

  it('returns null when there is no response payload', () => {
    expect(extractValidationMessage({})).toBeNull();
  });
});
