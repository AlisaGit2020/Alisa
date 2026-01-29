import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import {
  prepareDatabase,
  getTestUsers,
  addTransactionsToTestUsers,
  sleep,
} from '../test/helper-functions';

async function seed() {
  console.log('Starting database seed...');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();
  await app.init();

  try {
    console.log('Cleaning database tables...');
    await prepareDatabase(app);

    console.log('Creating test users and properties...');
    const testUsers = await getTestUsers(app);
    console.log(
      `  Created ${Object.keys(testUsers).length} users with properties`,
    );

    console.log('Creating transactions, expenses, and incomes...');
    await addTransactionsToTestUsers(app, testUsers);
    console.log('  Created transactions for all properties');

    console.log('\nSeed completed successfully!');
    console.log('\nSummary:');
    console.log('  - Users: 3 (John Doe, Jane Fonda, Joe Biden)');
    console.log('  - Properties: 4');
    console.log('  - Expense Types: 3');
    console.log('  - Income Types: 3');
    console.log('  - Transactions: 24 (6 per property)');

    // Wait for async event handlers to complete
    await sleep(500);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();
