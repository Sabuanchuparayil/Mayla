export type RelationshipGoalValue =
  | 'MARRIAGE'
  | 'LIFE_PARTNER'
  | 'RELATIONSHIP'
  | 'CASUAL_DATING'
  | 'COMPANIONSHIP'
  | 'SOCIAL_FUN'
  | 'RATHER_NOT_SAY';

export const RELATIONSHIP_GOALS: {
  value: RelationshipGoalValue;
  label: string;
  description: string;
  icon: string;
}[] = [
  { value: 'MARRIAGE', label: 'Marriage', description: 'Serious, family-oriented', icon: '💍' },
  { value: 'LIFE_PARTNER', label: 'Life Partner', description: 'Long-term commitment', icon: '💕' },
  { value: 'RELATIONSHIP', label: 'Relationship', description: 'Exclusive dating', icon: '❤️' },
  { value: 'CASUAL_DATING', label: 'Casual Dating', description: 'No pressure, see what happens', icon: '☕' },
  { value: 'COMPANIONSHIP', label: 'Companionship', description: 'Travel, dining, mutual company', icon: '✨' },
  { value: 'SOCIAL_FUN', label: 'Social & Fun', description: 'Casual, no strings attached', icon: '🍸' },
  { value: 'RATHER_NOT_SAY', label: 'Rather Not Say', description: 'Keep options open', icon: '🙈' },
];

export const GENDERS = [
  { value: 'MALE', label: 'Man' },
  { value: 'FEMALE', label: 'Woman' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'OTHER', label: 'Other' },
];

export const EDUCATION_LEVELS = [
  'High School',
  'Bachelor\'s',
  'Master\'s',
  'PhD',
  'Trade / Vocational',
  'Other',
];

export const INDUSTRIES = [
  'Tech',
  'Healthcare',
  'Finance',
  'Oil & Gas',
  'Education',
  'Hospitality',
  'Aviation',
  'Real Estate',
  'Media',
  'Government',
  'Retail',
  'Legal',
  'Freelance',
  'Student',
  'Other',
];

export const LIFESTYLE_TAGS = [
  'Fitness Lover',
  'Foodie',
  'Night Owl',
  'Early Bird',
  'Homebody',
  'Adventurer',
  'Bookworm',
  'Pet Parent',
  'Minimalist',
  'Social Butterfly',
  'Fine Dining',
  'Travel',
  'Luxury Lifestyle',
  'Beach Lover',
  'Coffee Addict',
];

export const LANGUAGES = [
  'Arabic',
  'English',
  'Hindi',
  'Urdu',
  'Filipino',
  'French',
  'Farsi',
  'Malayalam',
  'Turkish',
  'Bengali',
  'Russian',
  'Spanish',
  'German',
  'Chinese',
  'Other',
];

export const NATIONALITIES = [
  { code: 'AE', label: 'Emirati' },
  { code: 'SA', label: 'Saudi' },
  { code: 'IN', label: 'Indian' },
  { code: 'PK', label: 'Pakistani' },
  { code: 'PH', label: 'Filipino' },
  { code: 'EG', label: 'Egyptian' },
  { code: 'JO', label: 'Jordanian' },
  { code: 'LB', label: 'Lebanese' },
  { code: 'SY', label: 'Syrian' },
  { code: 'IQ', label: 'Iraqi' },
  { code: 'YE', label: 'Yemeni' },
  { code: 'OM', label: 'Omani' },
  { code: 'KW', label: 'Kuwaiti' },
  { code: 'QA', label: 'Qatari' },
  { code: 'BH', label: 'Bahraini' },
  { code: 'GB', label: 'British' },
  { code: 'US', label: 'American' },
  { code: 'FR', label: 'French' },
  { code: 'DE', label: 'German' },
  { code: 'RU', label: 'Russian' },
  { code: 'CN', label: 'Chinese' },
  { code: 'TR', label: 'Turkish' },
  { code: 'BD', label: 'Bangladeshi' },
  { code: 'NP', label: 'Nepali' },
  { code: 'LK', label: 'Sri Lankan' },
  { code: 'OTHER', label: 'Other' },
];

export const SMOKING_OPTIONS = ['Never', 'Socially', 'Regularly'];
export const DRINKING_OPTIONS = ['Never', 'Socially', 'Regularly'];
export const EXERCISE_OPTIONS = ['Daily', 'Often', 'Sometimes', 'Rarely'];

export const DREAM_DATES = [
  'Fine Dining',
  'Beach Day',
  'Desert Safari',
  'Road Trip',
  'Art Gallery',
  'Concert',
  'Cooking Together',
  'City Walk',
  'Yacht',
  'Brunch',
  'Coffee Date',
  'Spa Day',
];

export const PREMIUM_DREAM_DATES = ['Yacht', 'Desert Safari'];

export const OPEN_TO_CULTURES_OPTIONS = ['Yes', 'Neutral', 'Prefer same culture'];
export const RELOCATE_OPTIONS = ['Open', 'Maybe', 'Not open'];
export const LIFESTYLE_EXPECTATIONS_OPTIONS = ['Independent', 'Balanced', 'Shared'];

export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'tl', label: 'Filipino' },
  { code: 'ru', label: 'Russian' },
  { code: 'es', label: 'Spanish' },
  { code: 'ar', label: 'Arabic' },
] as const;

export const PERSONALITY_PROMPTS = [
  'My ideal Friday looks like...',
  'The way to my heart is...',
  "I'm weirdly attracted to...",
  'A life goal I\'m working towards...',
  'The best travel story I have is...',
  "I'll pick the restaurant if you pick...",
  'My most controversial opinion is...',
  'Two truths and a lie...',
  'I geek out about...',
  "After work you'll find me...",
  'My family would describe me as...',
  'A perfect first date for me is...',
];

export function relationshipGoalLabel(value: string | null | undefined): string {
  return RELATIONSHIP_GOALS.find((g) => g.value === value)?.label ?? 'Unknown';
}

export function relationshipGoalIcon(value: string | null | undefined): string {
  return RELATIONSHIP_GOALS.find((g) => g.value === value)?.icon ?? '💫';
}

export function nationalityLabel(code: string | null | undefined): string {
  if (!code) return '';
  return NATIONALITIES.find((n) => n.code === code)?.label ?? code;
}
