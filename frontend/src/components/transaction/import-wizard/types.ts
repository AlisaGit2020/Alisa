import { Transaction, TransactionType } from "@alisa-types";

export type BankId = "op" | "s-pankki";

export interface SupportedBank {
  id: BankId;
  name: string;
  logo: string;
}

export const SUPPORTED_BANKS: SupportedBank[] = [
  {
    id: "op",
    name: "Osuuspankki (OP)",
    logo: "/assets/banks/op-logo.svg",
  },
  {
    id: "s-pankki",
    name: "S-Pankki",
    logo: "/assets/banks/s-pankki-logo.svg",
  },
];

export interface ImportWizardState {
  activeStep: number;
  propertyId: number;
  selectedBank: BankId | null;
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
