import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DepreciationAsset } from './depreciation-asset.entity';
import { columnOptionTwoDecimal } from '@alisa-backend/common/typeorm.column.definitions';

@Entity()
export class DepreciationRecord {
  @PrimaryGeneratedColumn()
  public id: number;

  // Link to the depreciation asset
  @ManyToOne(() => DepreciationAsset, (asset) => asset.depreciationRecords, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'depreciationAssetId' })
  depreciationAsset: DepreciationAsset;

  @Column({ nullable: false })
  depreciationAssetId: number;

  // Year this depreciation was recorded for
  @Column()
  year: number;

  // Depreciation amount for this year
  @Column(columnOptionTwoDecimal)
  amount: number;

  // Remaining amount after this depreciation
  @Column(columnOptionTwoDecimal)
  remainingAfter: number;

  // When this record was calculated
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  calculatedAt: Date;
}
