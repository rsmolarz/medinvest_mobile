// Query client and API utilities
export { 
  queryClient, 
  getApiUrl, 
  apiRequest, 
  getQueryFn,
} from './query-client';

// Validation schemas and helpers
export {
  // Common validators
  emailSchema,
  passwordSchema,
  phoneSchema,
  nameSchema,
  amountSchema,
  urlSchema,
  // Auth schemas
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginFormData,
  type SignupFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
  // Profile schemas
  updateProfileSchema,
  type UpdateProfileFormData,
  // Investment schemas
  investSchema,
  createInvestSchema,
  type InvestFormData,
  // Payment schemas
  bankAccountSchema,
  cardSchema,
  type BankAccountFormData,
  type CardFormData,
  // Support schemas
  supportRequestSchema,
  type SupportRequestFormData,
  // Filter schemas
  investmentFiltersSchema,
  type InvestmentFiltersFormData,
  // Helpers
  validateForm,
  getFieldError,
  hasErrors,
} from './validation';
