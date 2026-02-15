export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'dev-jwt-secret-do-not-use-in-production',
};

export const googleConstants = {
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL:
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3000/api/auth/google/callback',
};

export const facebookConstants = {
  clientID: process.env.FACEBOOK_CLIENT_ID || '',
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
  callbackURL:
    process.env.FACEBOOK_CALLBACK_URL ||
    'http://localhost:3000/api/auth/facebook/callback',
};
