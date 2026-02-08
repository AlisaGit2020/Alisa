import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Service to fix the UNIQUE constraint on property_statistics table.
 * PostgreSQL's default UNIQUE constraint treats NULL != NULL, which causes
 * duplicate rows when propertyId, year, month, key have NULL values.
 * This service adds NULLS NOT DISTINCT to properly handle NULL values.
 */
@Injectable()
export class PropertyStatisticsSchemaService implements OnApplicationBootstrap {
  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.fixUniqueConstraint();
  }

  private async fixUniqueConstraint(): Promise<void> {
    // First, remove duplicate rows (keep the one with the highest id)
    await this.dataSource.query(`
      DELETE FROM property_statistics
      WHERE id NOT IN (
        SELECT MAX(id)
        FROM property_statistics
        GROUP BY "propertyId", year, month, key
      );
    `);

    // Then fix the constraint
    await this.dataSource.query(`
      DO $$
      BEGIN
        -- Drop the old constraint if it exists
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'UQ_property_statistics_composite'
        ) THEN
          ALTER TABLE property_statistics
          DROP CONSTRAINT "UQ_property_statistics_composite";
        END IF;

        -- Add the constraint with NULLS NOT DISTINCT
        ALTER TABLE property_statistics
        ADD CONSTRAINT "UQ_property_statistics_composite"
        UNIQUE NULLS NOT DISTINCT ("propertyId", year, month, key);
      END $$;
    `);
  }
}
