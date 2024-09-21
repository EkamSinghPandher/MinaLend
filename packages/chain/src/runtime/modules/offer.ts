import { TokenId, UInt64 } from "@proto-kit/library";
import { PublicKey, Struct } from "o1js";

export class Offer extends Struct({
    offerId: UInt64,
    lender: PublicKey,                      // The lender's identifier
    borrower: PublicKey,                    // The borrower's identifier
    annualInterestRate: UInt64,             // The annual interest rate (as a percentage or decimal)
    tokenId: TokenId,                        // The token/currency of the loan
    amount: UInt64,                         // The lending amount offered
    period: UInt64,                         // The lending period in days
    minPropertyValue: UInt64,               // The minimum property value that has to be proved
    minIncomeMonthly: UInt64,               // The minimum monthly income that has to be proved
    penalty: UInt64,                        // The annual penalty interest rate (as a percentage or decimal)
    status: UInt64,                         // The current status of the offer
}) { }
