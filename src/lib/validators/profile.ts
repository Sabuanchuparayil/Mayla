import { z } from 'zod';

const relationshipGoalEnum = z.enum([
  'MARRIAGE',
  'LIFE_PARTNER',
  'RELATIONSHIP',
  'CASUAL_DATING',
  'COMPANIONSHIP',
  'SOCIAL_FUN',
  'RATHER_NOT_SAY',
]);

const personalityPromptSchema = z.object({
  prompt: z.string().min(1).max(200),
  answer: z.string().min(1).max(200),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).nullable().optional(),
  birthDate: z.string().datetime().nullable().optional(),
  gender: z.string().max(30).nullable().optional(),
  nationality: z.string().max(10).nullable().optional(),
  languages: z.array(z.string().max(50)).max(10).optional(),
  education: z.string().max(100).nullable().optional(),
  jobTitle: z.string().max(100).nullable().optional(),
  industry: z.string().max(100).nullable().optional(),
  relationshipGoal: relationshipGoalEnum.nullable().optional(),
  lifestyle: z.array(z.string().max(50)).max(15).optional(),
  smoking: z.string().max(30).nullable().optional(),
  drinking: z.string().max(30).nullable().optional(),
  exercise: z.string().max(30).nullable().optional(),
  height: z.number().int().min(100).max(250).nullable().optional(),
  personalityPrompts: z.array(personalityPromptSchema).max(3).optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  photos: z.array(z.string().max(2048)).max(6).optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().length(2).optional(),
  travelModeEnabled: z.boolean().optional(),
  travelCity: z.string().max(100).nullable().optional(),
  travelLatitude: z.number().min(-90).max(90).nullable().optional(),
  travelLongitude: z.number().min(-180).max(180).nullable().optional(),
  profilePaused: z.boolean().optional(),
  incognitoMode: z.boolean().optional(),
  ladiesFirstMessaging: z.boolean().optional(),
  dreamDates: z.array(z.string().max(50)).max(8).optional(),
  openToDifferentCultures: z.string().max(50).nullable().optional(),
  relocateWillingness: z.string().max(50).nullable().optional(),
  lifestyleExpectations: z.string().max(50).nullable().optional(),
  photoBlurUntilMatch: z.boolean().optional(),
  locale: z.enum(['en', 'tl', 'ru', 'es', 'ar']).optional(),
});

export const onboardingProfileSchema = z.object({
  name: z.string().min(1).max(100),
  avatarUrl: z.string().max(2048).nullable().optional(),
  birthDate: z.string().datetime(),
  gender: z.string().min(1).max(30),
  nationality: z.string().min(1).max(10),
  languages: z.array(z.string().max(50)).min(1).max(10),
  education: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  relationshipGoal: relationshipGoalEnum,
  lifestyle: z.array(z.string().max(50)).max(15).optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  personalityPrompts: z.array(personalityPromptSchema).max(3).optional(),
  city: z.string().max(100).optional(),
  country: z.string().length(2).optional(),
});

export const preferencesUpdateSchema = z.object({
  genderPref: z.array(z.string().max(30)).max(5).optional(),
  ageMin: z.number().int().min(18).max(99).nullable().optional(),
  ageMax: z.number().int().min(18).max(99).nullable().optional(),
  nationalities: z.array(z.string().max(10)).max(20).optional(),
  languages: z.array(z.string().max(50)).max(10).optional(),
  maxDistanceKm: z.number().int().min(5).max(500).optional(),
  relationshipGoals: z.array(relationshipGoalEnum).max(7).optional(),
  dealbreakers: z.record(z.string(), z.string()).optional(),
  hideFromNationalities: z.array(z.string().max(10)).max(20).optional(),
  hideFromCities: z.array(z.string().max(100)).max(20).optional(),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().max(100).optional(),
});

export const blockSchema = z.object({
  userId: z.string().min(1),
});

export const reportSchema = z.object({
  userId: z.string().min(1),
  reason: z.enum([
    'FAKE_PROFILE',
    'HARASSMENT',
    'INAPPROPRIATE_CONTENT',
    'SCAM',
    'OTHER',
  ]),
  details: z.string().max(1000).optional(),
});

export const REPORT_CATEGORIES = [
  { value: 'FAKE_PROFILE', label: 'Fake or misleading profile' },
  { value: 'HARASSMENT', label: 'Harassment or bullying' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'SCAM', label: 'Scam or spam' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const availabilityUpdateSchema = z.object({
  availableDay: z.enum(['today', 'tomorrow', 'friday', 'saturday', 'sunday']).nullable(),
  availableTime: z.enum(['morning', 'afternoon', 'evening', 'night']).nullable(),
});

export const dateRequestCreateSchema = z.object({
  toUserId: z.string().min(1),
  message: z.string().max(300).optional(),
  proposedDay: z.enum(['today', 'tomorrow', 'friday', 'saturday', 'sunday']).optional(),
  proposedTime: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
});

export const dateRequestRespondSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
});

export const contactsSyncSchema = z.object({
  phones: z.array(z.string().max(30)).max(500),
});

export const giftSendSchema = z.object({
  toUserId: z.string().min(1),
  giftType: z.enum(['ROSE', 'COFFEE', 'DINNER_INVITE', 'WEEKEND_PACKAGE']),
  message: z.string().max(200).optional(),
});

export const giftRespondSchema = z.object({
  action: z.enum(['SEEN', 'DECLINED']),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export const translateSchema = z.object({
  text: z.string().min(1).max(2000),
  targetLang: z.enum(['en', 'tl', 'ru', 'es', 'ar']),
});

export const privacySettingsSchema = z.object({
  profilePaused: z.boolean().optional(),
  incognitoMode: z.boolean().optional(),
  ladiesFirstMessaging: z.boolean().optional(),
  photoBlurUntilMatch: z.boolean().optional(),
});

export const checkoutSchema = z.object({
  tier: z.enum(['GOLD', 'PLATINUM']),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});
