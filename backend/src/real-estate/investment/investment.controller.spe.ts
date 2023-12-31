import { Test } from '@nestjs/testing';
import { InvestmentService } from './investment.service';
import { InvestmentController } from './investment.controller';
import { Investment } from './entities/investment.entity';

describe('InvestmentController', () => {
  let investmentController: InvestmentController;
  let investmentService: InvestmentService;


  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        controllers: [InvestmentController],
        providers: [InvestmentService],
      }).compile();

      investmentService = moduleRef.get<InvestmentService>(InvestmentService);
      investmentController = moduleRef.get<InvestmentController>(InvestmentController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {  
      const investment = new Investment();      
      const result = [investment];
      //jest.spyOn(investmentService, 'findAll').mockResolvedValue(() => result);

      expect(await investmentController.findAll()).toBe(result);
    });
  });
});