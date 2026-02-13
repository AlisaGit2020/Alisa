import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InvestmentCalculator } from './classes/investment-calculator.class';
import { InvestmentInputDto } from './dtos/investment-input.dto';
import { Investment } from './entities/investment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Repository } from 'typeorm';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { typeormWhereTransformer } from '@alisa-backend/common/transformer/typeorm-where.transformer';
import { FindOptionsWhereWithUserId } from '@alisa-backend/common/types';
import {
  DataSaveResultDto,
  DataSaveResultRowDto,
} from '@alisa-backend/common/dtos/data-save-result.dto';

@Injectable()
export class InvestmentService {
  constructor(
    @InjectRepository(Investment)
    private repository: Repository<Investment>,
    private authService: AuthService,
  ) {}

  calculate(investment: InvestmentInputDto): InvestmentCalculator {
    return new InvestmentCalculator(investment);
  }

  async search(user: JWTUser, options: FindManyOptions<Investment>): Promise<Investment[]> {
    if (!options) {
      options = {};
    }
    if (options.where !== undefined) {
      options.where = typeormWhereTransformer(options.where);
    }
    options.where = this.authService.addUserFilter<Investment>(
      user,
      options.where as FindOptionsWhereWithUserId<Investment>,
    ) as FindOptionsWhereWithUserId<Investment>;
    return this.repository.find(options);
  }

  async findAll(user: JWTUser): Promise<Investment[]> {
    return this.repository.find({ where: { userId: user.id } });
  }

  async findOne(user: JWTUser, id: number): Promise<Investment> {
    const investment = await this.repository.findOneBy({ id, userId: user.id });
    if (!investment) {
      throw new NotFoundException('Investment not found');
    }
    return investment;
  }

  async saveCalculation(
    user: JWTUser,
    investmentCalculation: InvestmentCalculator,
    inputDto: InvestmentInputDto,
    id?: number,
  ): Promise<Investment> {
    // Validate property ownership if propertyId is provided
    if (inputDto.propertyId) {
      const hasOwnership = await this.authService.hasOwnership(user, inputDto.propertyId);
      if (!hasOwnership) {
        throw new UnauthorizedException('You do not have access to this property');
      }
    }

    // save to database
    let investmentEntity: Investment;

    if (id) {
      investmentEntity = await this.findOne(user, id);
    } else {
      investmentEntity = new Investment();
      investmentEntity.userId = user.id;
    }
    if (!investmentEntity) {
      throw new NotFoundException('Investment not found');
    }

    investmentEntity.deptFreePrice = investmentCalculation.deptFreePrice;
    investmentEntity.deptShare = investmentCalculation.deptShare;
    investmentEntity.transferTaxPercent =
      investmentCalculation.transferTaxPercent;
    investmentEntity.maintenanceFee = investmentCalculation.maintenanceFee;
    investmentEntity.chargeForFinancialCosts =
      investmentCalculation.chargeForFinancialCosts;
    investmentEntity.rentPerMonth = investmentCalculation.rentPerMonth;
    investmentEntity.apartmentSize = investmentCalculation.apartmentSize;
    investmentEntity.waterCharge = investmentCalculation.waterCharge;
    investmentEntity.downPayment = investmentCalculation.downPayment;
    investmentEntity.loanInterestPercent =
      investmentCalculation.loanInterestPercent;
    investmentEntity.loanPeriod = investmentCalculation.loanPeriod;
    investmentEntity.sellingPrice = investmentCalculation.sellingPrice;
    investmentEntity.transferTax = investmentCalculation.transferTax;
    investmentEntity.maintenanceCosts = investmentCalculation.maintenanceCosts;
    investmentEntity.rentalYieldPercent =
      investmentCalculation.rentalYieldPercent;
    investmentEntity.rentalIncomePerYear =
      investmentCalculation.rentalIncomePerYear;
    investmentEntity.pricePerSquareMeter =
      investmentCalculation.pricePerSquareMeter;
    investmentEntity.loanFinancing = investmentCalculation.loanFinancing;
    investmentEntity.loanFirstMonthInterest =
      investmentCalculation.loanFirstMonthInterest;
    investmentEntity.loanFirstMonthInstallment =
      investmentCalculation.loanFirstMonthInstallment;
    investmentEntity.taxDeductibleExpensesPerYear =
      investmentCalculation.taxDeductibleExpensesPerYear;
    investmentEntity.profitPerYear = investmentCalculation.profitPerYear;
    investmentEntity.taxPerYear = investmentCalculation.taxPerYear;
    investmentEntity.expensesPerMonth = investmentCalculation.expensesPerMonth;
    investmentEntity.cashFlowPerMonth = investmentCalculation.cashFlowPerMonth;
    investmentEntity.cashFlowAfterTaxPerMonth =
      investmentCalculation.cashFlowAfterTaxPerMonth;
    investmentEntity.propertyId = inputDto.propertyId;
    investmentEntity.name = inputDto.name;

    await this.repository.save(investmentEntity);
    return investmentEntity;
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    await this.findOne(user, id);
    await this.repository.delete(id);
  }

  async deleteMany(user: JWTUser, ids: number[]): Promise<DataSaveResultDto> {
    if (ids.length === 0) {
      throw new BadRequestException('No ids provided');
    }

    const investments = await this.repository.find({
      where: { id: In(ids) },
    });

    const deleteTask = investments.map(async (investment) => {
      try {
        // Check ownership - investment must belong to the user
        if (investment.userId !== user.id) {
          return {
            id: investment.id,
            statusCode: 403,
            message: 'Forbidden',
          } as DataSaveResultRowDto;
        }

        await this.repository.delete(investment.id);

        return {
          id: investment.id,
          statusCode: 200,
          message: 'OK',
        } as DataSaveResultRowDto;
      } catch (e) {
        return {
          id: investment.id,
          statusCode: e.status || 500,
          message: e.message,
        } as DataSaveResultRowDto;
      }
    });

    const results = await Promise.all(deleteTask);

    const result = new DataSaveResultDto();
    result.rows.total = investments.length;
    result.rows.success = results.filter((r) => r.statusCode === 200).length;
    result.rows.failed = results.filter((r) => r.statusCode !== 200).length;
    result.allSuccess = result.rows.failed === 0;
    result.results = results;
    return result;
  }
}
