process.env.DB_HOST = 'localhost'; //Tests must run against localhost because we are not inside a container.
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'postgres';
process.env.DB_PASSWORD = 'mysecretpassword';
process.env.DB_DATABASE = 'asset_test';

// Google OAuth test credentials (dummy values for testing)
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
