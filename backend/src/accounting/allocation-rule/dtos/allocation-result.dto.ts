export class AllocatedTransactionDto {
  transactionId: number;
  ruleId: number;
  ruleName: string;
  action?: 'type_set' | 'loan_split';
}

export class SkippedTransactionDto {
  transactionId: number;
  reason: 'no_match' | 'loan_split_failed' | 'already_allocated';
}

export class ConflictingTransactionDto {
  transactionId: number;
  matchingRules: { id: number; name: string }[];
}

export class AllocationResultDto {
  allocated: AllocatedTransactionDto[];
  skipped: SkippedTransactionDto[];
  conflicting: ConflictingTransactionDto[];
}
