import { renderHook, act } from "@testing-library/react";
import { useFormValidation, FieldRules } from "./useFormValidation";

// Mock translation function
const mockT = (key: string, params?: Record<string, unknown>) => {
  const messages: Record<string, string> = {
    "common:validation.required": "This field is required",
    "common:validation.min": `Value must be at least ${params?.min}`,
    "common:validation.max": `Value must be at most ${params?.max}`,
  };
  return messages[key] || key;
};

interface TestData {
  name: string;
  size: number;
  description?: string;
}

describe("useFormValidation", () => {
  it("returns no errors when validation passes", () => {
    const rules: Partial<Record<keyof TestData, FieldRules>> = {
      name: { required: true },
      size: { min: 1, max: 100 },
    };

    const { result } = renderHook(() => useFormValidation<TestData>(rules, mockT));

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate({ name: "Test", size: 50 });
    });

    expect(isValid!).toBe(true);
    expect(result.current.fieldErrors).toEqual({});
  });

  it("returns error for missing required field", () => {
    const rules: Partial<Record<keyof TestData, FieldRules>> = {
      name: { required: true },
    };

    const { result } = renderHook(() => useFormValidation<TestData>(rules, mockT));

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate({ name: "", size: 10 });
    });

    expect(isValid!).toBe(false);
    expect(result.current.fieldErrors.name).toBe("This field is required");
  });

  it("returns error for value below minimum", () => {
    const rules: Partial<Record<keyof TestData, FieldRules>> = {
      size: { min: 1 },
    };

    const { result } = renderHook(() => useFormValidation<TestData>(rules, mockT));

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate({ name: "Test", size: 0 });
    });

    expect(isValid!).toBe(false);
    expect(result.current.fieldErrors.size).toBe("Value must be at least 1");
  });

  it("returns error for value above maximum", () => {
    const rules: Partial<Record<keyof TestData, FieldRules>> = {
      size: { max: 100 },
    };

    const { result } = renderHook(() => useFormValidation<TestData>(rules, mockT));

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate({ name: "Test", size: 150 });
    });

    expect(isValid!).toBe(false);
    expect(result.current.fieldErrors.size).toBe("Value must be at most 100");
  });

  it("clears all errors", () => {
    const rules: Partial<Record<keyof TestData, FieldRules>> = {
      name: { required: true },
    };

    const { result } = renderHook(() => useFormValidation<TestData>(rules, mockT));

    act(() => {
      result.current.validate({ name: "", size: 10 });
    });

    expect(result.current.fieldErrors.name).toBeDefined();

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.fieldErrors).toEqual({});
  });

  it("clears single field error", () => {
    const rules: Partial<Record<keyof TestData, FieldRules>> = {
      name: { required: true },
      size: { min: 1 },
    };

    const { result } = renderHook(() => useFormValidation<TestData>(rules, mockT));

    act(() => {
      result.current.validate({ name: "", size: 0 });
    });

    expect(result.current.fieldErrors.name).toBeDefined();
    expect(result.current.fieldErrors.size).toBeDefined();

    act(() => {
      result.current.clearFieldError("name");
    });

    expect(result.current.fieldErrors.name).toBeUndefined();
    expect(result.current.fieldErrors.size).toBeDefined();
  });
});
