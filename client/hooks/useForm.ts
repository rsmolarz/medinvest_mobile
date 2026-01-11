import { useState, useCallback, useMemo, useRef } from 'react';
import { z } from 'zod';

// ============================================
// Types
// ============================================

export interface FieldState {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
}

export interface UseFormOptions<T extends Record<string, any>> {
  /** Initial form values */
  initialValues: T;
  /** Zod schema for validation */
  schema?: z.ZodSchema<T>;
  /** Validate on change */
  validateOnChange?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Submit handler */
  onSubmit?: (values: T) => void | Promise<void>;
}

export interface UseFormReturn<T extends Record<string, any>> {
  // State
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;

  // Field handlers
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: <K extends keyof T>(field: K, error: string | undefined) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  
  // Field props helper
  getFieldProps: <K extends keyof T>(field: K) => {
    value: T[K];
    onChangeText: (value: string) => void;
    onBlur: () => void;
    error: string | undefined;
  };

  // Form actions
  handleSubmit: () => Promise<void>;
  validate: () => boolean;
  validateField: <K extends keyof T>(field: K) => string | undefined;
  reset: (values?: Partial<T>) => void;
  resetField: <K extends keyof T>(field: K) => void;
}

// ============================================
// useForm Hook
// ============================================

export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const {
    initialValues,
    schema,
    validateOnChange = true,
    validateOnBlur = true,
    onSubmit,
  } = options;

  // Store initial values for reset
  const initialValuesRef = useRef(initialValues);

  // Form state
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrorsState] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [dirty, setDirtyState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Computed state
  const isValid = useMemo(() => {
    if (!schema) return true;
    const result = schema.safeParse(values);
    return result.success;
  }, [schema, values]);

  const isDirty = useMemo(() => {
    return Object.values(dirty).some(Boolean);
  }, [dirty]);

  // Validate entire form
  const validate = useCallback((): boolean => {
    if (!schema) return true;

    const result = schema.safeParse(values);

    if (result.success) {
      setErrorsState({});
      return true;
    }

    const newErrors: Partial<Record<keyof T, string>> = {};
    
    for (const error of result.error.errors) {
      const path = error.path[0] as keyof T;
      if (!newErrors[path]) {
        newErrors[path] = error.message;
      }
    }

    setErrorsState(newErrors);
    return false;
  }, [schema, values]);

  // Validate single field
  const validateField = useCallback(
    <K extends keyof T>(field: K): string | undefined => {
      if (!schema) return undefined;

      const result = schema.safeParse(values);

      if (result.success) {
        setErrorsState((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
        return undefined;
      }

      const fieldError = result.error.errors.find(
        (err) => err.path[0] === field
      );

      const errorMessage = fieldError?.message;

      setErrorsState((prev) => ({
        ...prev,
        [field]: errorMessage,
      }));

      return errorMessage;
    },
    [schema, values]
  );

  // Set single value
  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValuesState((prev) => ({ ...prev, [field]: value }));
      setDirtyState((prev) => ({ ...prev, [field]: true }));

      if (validateOnChange) {
        // Defer validation to next tick to use updated values
        setTimeout(() => validateField(field), 0);
      }
    },
    [validateOnChange, validateField]
  );

  // Set multiple values
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
    
    const newDirty: Partial<Record<keyof T, boolean>> = {};
    for (const key of Object.keys(newValues) as Array<keyof T>) {
      newDirty[key] = true;
    }
    setDirtyState((prev) => ({ ...prev, ...newDirty }));
  }, []);

  // Set single error
  const setError = useCallback(
    <K extends keyof T>(field: K, error: string | undefined) => {
      setErrorsState((prev) => {
        if (error === undefined) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return { ...prev, [field]: error };
      });
    },
    []
  );

  // Set multiple errors
  const setErrors = useCallback(
    (newErrors: Partial<Record<keyof T, string>>) => {
      setErrorsState(newErrors);
    },
    []
  );

  // Set touched state
  const setTouched = useCallback(
    <K extends keyof T>(field: K, isTouched = true) => {
      setTouchedState((prev) => ({ ...prev, [field]: isTouched }));

      if (validateOnBlur && isTouched) {
        validateField(field);
      }
    },
    [validateOnBlur, validateField]
  );

  // Get field props for Input component
  const getFieldProps = useCallback(
    <K extends keyof T>(field: K) => ({
      value: values[field],
      onChangeText: (value: string) => setValue(field, value as T[K]),
      onBlur: () => setTouched(field, true),
      error: touched[field] ? errors[field] : undefined,
    }),
    [values, errors, touched, setValue, setTouched]
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setSubmitCount((prev) => prev + 1);

    // Mark all fields as touched
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    for (const key of Object.keys(values) as Array<keyof T>) {
      allTouched[key] = true;
    }
    setTouchedState(allTouched);

    // Validate
    const isFormValid = validate();
    if (!isFormValid) return;

    // Submit
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validate, onSubmit]);

  // Reset form
  const reset = useCallback((newValues?: Partial<T>) => {
    setValuesState({ ...initialValuesRef.current, ...newValues });
    setErrorsState({});
    setTouchedState({});
    setDirtyState({});
    setSubmitCount(0);
  }, []);

  // Reset single field
  const resetField = useCallback(<K extends keyof T>(field: K) => {
    setValuesState((prev) => ({
      ...prev,
      [field]: initialValuesRef.current[field],
    }));
    setErrorsState((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setTouchedState((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setDirtyState((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
    setValue,
    setValues,
    setError,
    setErrors,
    setTouched,
    getFieldProps,
    handleSubmit,
    validate,
    validateField,
    reset,
    resetField,
  };
}

// ============================================
// useField Hook (for individual fields)
// ============================================

export interface UseFieldOptions<T> {
  name: string;
  validate?: (value: T) => string | undefined;
  initialValue?: T;
}

export function useField<T = string>(options: UseFieldOptions<T>) {
  const { name, validate, initialValue } = options;

  const [value, setValue] = useState<T | undefined>(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const handleChange = useCallback(
    (newValue: T) => {
      setValue(newValue);
      if (validate && touched) {
        setError(validate(newValue));
      }
    },
    [validate, touched]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (validate && value !== undefined) {
      setError(validate(value));
    }
  }, [validate, value]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(undefined);
    setTouched(false);
  }, [initialValue]);

  return {
    name,
    value,
    error: touched ? error : undefined,
    touched,
    onChange: handleChange,
    onBlur: handleBlur,
    reset,
    props: {
      value,
      onChangeText: handleChange,
      onBlur: handleBlur,
      error: touched ? error : undefined,
    },
  };
}

export default useForm;
