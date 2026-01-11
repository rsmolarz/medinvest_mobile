import { z } from 'zod';

// ============================================
// Common Validators
// ============================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase, and a number'
  );

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^\+?[\d\s\-()]{10,}$/.test(val),
    'Please enter a valid phone number'
  );

export const nameSchema = z
  .string()
  .min(1, 'This field is required')
  .min(2, 'Must be at least 2 characters')
  .max(50, 'Must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Only letters, spaces, hyphens, and apostrophes allowed');

export const amountSchema = z
  .number({ invalid_type_error: 'Please enter a valid amount' })
  .positive('Amount must be greater than 0');

export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .optional()
  .or(z.literal(''));

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ============================================
// Profile Schemas
// ============================================

export const updateProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// ============================================
// Investment Schemas
// ============================================

export const investSchema = z.object({
  amount: amountSchema.refine(
    (val) => val >= 1000,
    'Minimum investment is $1,000'
  ),
  paymentMethodId: z.string().min(1, 'Please select a payment method'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the investment terms',
  }),
  acceptRisk: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge the risk disclosure',
  }),
});

export type InvestFormData = z.infer<typeof investSchema>;

// Dynamic invest schema with custom minimum
export function createInvestSchema(minimumInvestment: number) {
  return z.object({
    amount: amountSchema.refine(
      (val) => val >= minimumInvestment,
      `Minimum investment is $${minimumInvestment.toLocaleString()}`
    ),
    paymentMethodId: z.string().min(1, 'Please select a payment method'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the investment terms',
    }),
    acceptRisk: z.boolean().refine((val) => val === true, {
      message: 'You must acknowledge the risk disclosure',
    }),
  });
}

// ============================================
// Payment Method Schemas
// ============================================

export const bankAccountSchema = z.object({
  accountType: z.enum(['checking', 'savings'], {
    required_error: 'Please select account type',
  }),
  routingNumber: z
    .string()
    .min(1, 'Routing number is required')
    .length(9, 'Routing number must be 9 digits')
    .regex(/^\d+$/, 'Routing number must contain only numbers'),
  accountNumber: z
    .string()
    .min(1, 'Account number is required')
    .min(8, 'Account number must be at least 8 digits')
    .max(17, 'Account number must be at most 17 digits')
    .regex(/^\d+$/, 'Account number must contain only numbers'),
  confirmAccountNumber: z.string().min(1, 'Please confirm account number'),
  accountHolderName: z
    .string()
    .min(1, 'Account holder name is required')
    .min(2, 'Name must be at least 2 characters'),
}).refine((data) => data.accountNumber === data.confirmAccountNumber, {
  message: 'Account numbers do not match',
  path: ['confirmAccountNumber'],
});

export type BankAccountFormData = z.infer<typeof bankAccountSchema>;

export const cardSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .transform((val) => val.replace(/\s/g, ''))
    .refine(
      (val) => /^\d{13,19}$/.test(val),
      'Please enter a valid card number'
    ),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Please use MM/YY format')
    .refine((val) => {
      const [month, year] = val.split('/').map(Number);
      const now = new Date();
      const expiry = new Date(2000 + year, month);
      return expiry > now;
    }, 'Card has expired'),
  cvv: z
    .string()
    .min(1, 'CVV is required')
    .regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
  cardholderName: z
    .string()
    .min(1, 'Cardholder name is required')
    .min(2, 'Name must be at least 2 characters'),
  billingZip: z
    .string()
    .min(1, 'Billing ZIP is required')
    .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
});

export type CardFormData = z.infer<typeof cardSchema>;

// ============================================
// Support Schemas
// ============================================

export const supportRequestSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters'),
  category: z.enum(
    ['general', 'investment', 'account', 'technical', 'billing'],
    { required_error: 'Please select a category' }
  ),
  message: z
    .string()
    .min(1, 'Message is required')
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message must be less than 2000 characters'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export type SupportRequestFormData = z.infer<typeof supportRequestSchema>;

// ============================================
// Filter Schemas
// ============================================

export const investmentFiltersSchema = z.object({
  category: z.string().optional(),
  riskLevel: z.enum(['Low', 'Medium', 'High']).optional(),
  minInvestment: z.number().optional(),
  status: z.enum(['active', 'funded', 'closed']).optional(),
  sortBy: z.enum(['newest', 'endingSoon', 'mostFunded', 'highestROI']).optional(),
});

export type InvestmentFiltersFormData = z.infer<typeof investmentFiltersSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate form data against a schema
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  
  for (const error of result.error.errors) {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = error.message;
    }
  }

  return { success: false, errors };
}

/**
 * Get first error message for a field
 */
export function getFieldError(
  errors: z.ZodError | undefined,
  field: string
): string | undefined {
  if (!errors) return undefined;
  
  const fieldError = errors.errors.find(
    (err) => err.path.join('.') === field
  );
  
  return fieldError?.message;
}

/**
 * Check if form has any errors
 */
export function hasErrors(errors: z.ZodError | undefined): boolean {
  return errors !== undefined && errors.errors.length > 0;
}

export default {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  investSchema,
  createInvestSchema,
  bankAccountSchema,
  cardSchema,
  supportRequestSchema,
  investmentFiltersSchema,
  validateForm,
  getFieldError,
  hasErrors,
};
