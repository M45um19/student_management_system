export const COOKIES = {
  ACCESS_TOKEN: 'sms_access_token',
  REFRESH_TOKEN: 'sms_refresh_token',
} as const;

export const TOKEN_EXPIRY = {
  ACCESS_SECONDS: 15 * 60, // 15 minutes
  REFRESH_SECONDS: 7 * 24 * 60 * 60, // 7 days
} as const;
