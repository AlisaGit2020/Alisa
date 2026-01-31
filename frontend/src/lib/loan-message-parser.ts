/**
 * Parsed components from a Finnish loan payment message.
 */
export interface LoanPaymentComponents {
  /** "Lyhennys" - principal payment amount */
  principal: number;
  /** "Korko" - interest payment amount */
  interest: number;
  /** "Kulut" - handling fee amount (optional, may be 0) */
  handlingFee: number;
  /** "Jäljellä" - remaining loan balance */
  remaining: number;
}

/**
 * Parses a Finnish number string to a JavaScript number.
 * Handles comma as decimal separator and space as thousands separator.
 * Examples: "244,25" -> 244.25, "65 851,63" -> 65851.63
 */
function parseFinnishNumber(value: string): number {
  if (!value) return 0;
  // Remove spaces (thousands separator) and replace comma with period
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parses a loan payment message in Finnish bank format.
 *
 * Expected format:
 * "Lyhennys 244,25 euroa Korko 166,37 euroa Kulut 2,50 euroa OP-bonuksista Jäljellä 65 851,63 euroa"
 *
 * Note: "Kulut" (handling fee) may not be present in all messages.
 *
 * @param message - The transaction description/message to parse
 * @returns Parsed loan payment components, or null if the message doesn't match the expected format
 */
export function parseLoanPaymentMessage(
  message: string
): LoanPaymentComponents | null {
  if (!message) return null;

  // Pattern explanation:
  // - "Lyhennys" followed by amount and "euroa"
  // - "Korko" followed by amount and "euroa"
  // - Optional "Kulut" followed by amount and "euroa" (may include "OP-bonuksista")
  // - "Jäljellä" followed by amount and "euroa"
  //
  // Finnish numbers use comma as decimal separator and space as thousands separator
  const numberPattern = "([\\d\\s]+,\\d{2})";

  const principalMatch = message.match(
    new RegExp(`Lyhennys\\s+${numberPattern}\\s+euroa`, "i")
  );
  const interestMatch = message.match(
    new RegExp(`Korko\\s+${numberPattern}\\s+euroa`, "i")
  );
  const handlingFeeMatch = message.match(
    new RegExp(`Kulut\\s+${numberPattern}\\s+euroa`, "i")
  );
  const remainingMatch = message.match(
    new RegExp(`Jäljellä\\s+${numberPattern}\\s+euroa`, "i")
  );

  // Must have at least principal, interest, and remaining to be a valid loan payment message
  if (!principalMatch || !interestMatch || !remainingMatch) {
    return null;
  }

  return {
    principal: parseFinnishNumber(principalMatch[1]),
    interest: parseFinnishNumber(interestMatch[1]),
    handlingFee: handlingFeeMatch ? parseFinnishNumber(handlingFeeMatch[1]) : 0,
    remaining: parseFinnishNumber(remainingMatch[1]),
  };
}

/**
 * Checks if a message matches the Finnish loan payment format.
 *
 * @param message - The transaction description/message to check
 * @returns true if the message matches the loan payment format
 */
export function isLoanPaymentMessage(message: string): boolean {
  return parseLoanPaymentMessage(message) !== null;
}
