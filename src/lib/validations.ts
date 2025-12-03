import { z } from "zod";

// Common validation patterns
const phoneRegex = /^[\d\s\-+()]{10,20}$/;
const zipRegex = /^\d{5}(-\d{4})?$/;

// Reusable field schemas
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email must be less than 255 characters");

export const phoneSchema = z
  .string()
  .regex(phoneRegex, "Invalid phone number")
  .or(z.literal(""))
  .optional();

export const priceSchema = z
  .number({ invalid_type_error: "Must be a number" })
  .min(0, "Price cannot be negative")
  .max(10000000, "Price seems too high");

export const optionalPriceSchema = priceSchema.optional().or(z.literal(null));

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Seller Lead schema
export const sellerLeadSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("")),
  address: z
    .string()
    .min(1, "Address is required")
    .max(200, "Address must be less than 200 characters"),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().regex(zipRegex, "Invalid ZIP code").optional().or(z.literal("")),
  home_type: z.enum(["single", "double", "triple"]).default("single"),
  year_built: z
    .number()
    .min(1900, "Year must be after 1900")
    .max(new Date().getFullYear(), "Year cannot be in the future")
    .optional()
    .or(z.literal(null)),
  condition: z
    .number()
    .min(1, "Condition must be between 1 and 10")
    .max(10, "Condition must be between 1 and 10")
    .optional()
    .or(z.literal(null)),
  length_ft: z.number().min(0).max(100).optional().or(z.literal(null)),
  width_ft: z.number().min(0).max(50).optional().or(z.literal(null)),
  park_owned: z.boolean().default(true),
  lot_rent: optionalPriceSchema,
  asking_price: priceSchema,
  owed_amount: optionalPriceSchema,
  estimated_value: optionalPriceSchema,
  target_offer: optionalPriceSchema,
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional(),
});

export type SellerLeadFormData = z.infer<typeof sellerLeadSchema>;

// Buyer schema
export const buyerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("")),
  min_price: optionalPriceSchema,
  max_price: optionalPriceSchema,
  home_types: z.array(z.enum(["single", "double", "triple"])).default(["single"]),
  locations: z.array(z.string()).optional(),
  credit_score: z
    .number()
    .min(300, "Credit score must be at least 300")
    .max(850, "Credit score cannot exceed 850")
    .optional()
    .or(z.literal(null)),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => {
    if (data.min_price && data.max_price) {
      return data.max_price >= data.min_price;
    }
    return true;
  },
  {
    message: "Max price must be greater than or equal to min price",
    path: ["max_price"],
  }
);

export type BuyerFormData = z.infer<typeof buyerSchema>;

// Expense schema
export const expenseSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  amount: z
    .number({ invalid_type_error: "Amount is required" })
    .min(0.01, "Amount must be greater than 0")
    .max(1000000, "Amount seems too high"),
  category: z
    .enum(["marketing", "travel", "repairs", "legal", "closing", "other"])
    .default("other"),
  expense_date: z.string().optional(),
  seller_lead_id: z.string().uuid().optional().or(z.literal("")),
  receipt_url: z.string().url().optional().or(z.literal("")),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

// Appointment schema
export const appointmentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().max(1000).optional(),
  type: z.enum(["call", "meeting", "property_viewing", "closing"]).default("meeting"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().optional(),
  location: z.string().max(200).optional(),
  seller_lead_id: z.string().uuid().optional().or(z.literal("")),
  buyer_id: z.string().uuid().optional().or(z.literal("")),
}).refine(
  (data) => {
    if (data.start_time && data.end_time) {
      return new Date(data.end_time) > new Date(data.start_time);
    }
    return true;
  },
  {
    message: "End time must be after start time",
    path: ["end_time"],
  }
);

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

// CSV Import schema (for buyers)
export const csvBuyerRowSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  min_price: z.string().transform((v) => (v ? Number(v) : undefined)).optional(),
  max_price: z.string().transform((v) => (v ? Number(v) : undefined)).optional(),
  locations: z.string().transform((v) => (v ? v.split(",").map((s) => s.trim()) : [])).optional(),
  credit_score: z.string().transform((v) => (v ? Number(v) : undefined)).optional(),
  notes: z.string().optional(),
});

export type CSVBuyerRow = z.infer<typeof csvBuyerRowSchema>;
