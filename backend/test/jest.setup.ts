process.env.DB_HOST = 'localhost'; //Tests must run against localhost because we are not inside a container.
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'postgres';
process.env.DB_PASSWORD = 'mysecretpassword';
process.env.DB_DATABASE = 'alisa_test';