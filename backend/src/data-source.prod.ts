import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Production data source for running migrations with compiled JS files
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'mysecretpassword',
  database: process.env.DB_DATABASE || 'asset',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
});
