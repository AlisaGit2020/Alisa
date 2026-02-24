export interface DependencyItem {
  id: number;
  description: string;
}

export type DependencyType =
  | 'transaction'
  | 'expense'
  | 'income'
  | 'statistics'
  | 'depreciationAsset'
  | 'investment';

export interface DependencyGroup {
  type: DependencyType;
  count: number;
  samples: DependencyItem[];
}

export class PropertyDeleteValidationDto {
  canDelete: boolean;
  dependencies: DependencyGroup[];
  message?: string;
}
