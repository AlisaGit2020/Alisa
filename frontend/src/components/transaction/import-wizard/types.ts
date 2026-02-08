import { Transaction, TransactionType } from "@alisa-types";

export interface ImportWizardState {
  activeStep: number;
  propertyId: number;
  files: File[];
  isUploading: boolean;
  uploadError: string | null;
  importedTransactionIds: number[];
  transactions: Transaction[];
  selectedIds: number[];
  selectedTransactionTypes: TransactionType[];
  hasUnknownTypes: boolean;
  isApproving: boolean;
  approveError: string | null;
  importStats: ImportStats;
}

export interface ImportStats {
  totalCount: number;
  totalAmount: number;
  byType: Map<TransactionType, { count: number; amount: number }>;
}

export const WIZARD_STEPS = [
  "import",
  "review",
  "accept",
  "done",
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

export const getStepIndex = (step: WizardStep): number => {
  return WIZARD_STEPS.indexOf(step);
};

export const getStepName = (index: number): WizardStep => {
  return WIZARD_STEPS[index];
};

export interface ImportResponse {
  data: number[];
}
