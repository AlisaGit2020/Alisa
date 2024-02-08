import { OpService } from './op.service';
import { MOCKS_PATH } from '@alisa-backend/constants';

describe('OP Service', () => {
  let service: OpService;

  beforeAll(() => {
    service = new OpService();
  });

  it('import CSV', async () => {
    const csvFile = `${MOCKS_PATH}/import/op.transactions.csv`;

    console.log(csvFile);
    await service.importCsv(csvFile);
  });
});
