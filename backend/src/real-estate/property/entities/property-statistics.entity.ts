import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';

@Entity()
export class PropertyStatistics {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => Property, (property) => property.statistics)
  public property: Property;

  @Column()
  public balance: number;
}
