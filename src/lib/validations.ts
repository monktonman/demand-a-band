import { z } from "zod";

// Auth
// US phone: optional, must be 10 digits (we strip formatting)
const phoneSchema = z
  .string()
  .transform((val) => val.replace(/[\s\-\(\)\.]/g, "")) // strip formatting
  .refine((val) => val === "" || /^(\+?1)?[2-9]\d{9}$/.test(val), {
    message: "Enter a valid US phone number",
  })
  .optional();

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: phoneSchema,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Band preferences
export const bandPreferenceSchema = z.object({
  bandId: z.string(),
  maxTicketPrice: z.number().min(5).max(10000),
  priority: z.number().min(1).optional(),
  isDreamShow: z.boolean().optional(),
});

export const bandPreferencesSchema = z.object({
  preferences: z.array(bandPreferenceSchema).min(3, "Select at least 3 bands"),
});

// City preferences
export const cityPreferenceSchema = z.object({
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "Use 2-letter state code"),
  maxRadius: z.number().min(5).max(200).optional(),
});

export const cityPreferencesSchema = z.object({
  preferences: z.array(cityPreferenceSchema).min(1, "Select at least 1 city"),
});

// Events
export const createEventSchema = z.object({
  bandId: z.string(),
  venueId: z.string(),
  title: z.string().min(3),
  description: z.string().optional(),
  windowStart: z.string().or(z.date()).optional(),
  windowEnd: z.string().or(z.date()).optional(),
  eventDate: z.string().or(z.date()),
  doorsTime: z.string().or(z.date()).optional(),
  showTime: z.string().or(z.date()).optional(),
  ticketPrice: z.number().min(1),
  minPledges: z.number().min(1),
  maxCapacity: z.number().min(1),
  pledgeDeadline: z.string().or(z.date()),
  imageUrl: z.string().url().optional(),
});

// Pledges
export const createPledgeSchema = z.object({
  eventId: z.string(),
  quantity: z.number().min(1).max(10),
  paymentMethodId: z.string().optional(),
});

// Venues
export const createVenueSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().length(2),
  zipCode: z.string().min(5),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().min(10),
  venueType: z.string(),
  genres: z.array(z.string()),
  imageUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  ownership: z.enum(["INDEPENDENT", "CHAIN", "NONPROFIT"]),
  notes: z.string().optional(),
});

// Types derived from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BandPreferenceInput = z.infer<typeof bandPreferenceSchema>;
export type CityPreferenceInput = z.infer<typeof cityPreferenceSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreatePledgeInput = z.infer<typeof createPledgeSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
