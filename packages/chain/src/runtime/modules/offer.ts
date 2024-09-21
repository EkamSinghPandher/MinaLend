import { RuntimeModule } from "@proto-kit/module";
import { runtimeModule } from "@proto-kit/module/dist/module/decorator";
import { PublicKey } from "o1js";

@runtimeModule()
class Offer extends RuntimeModule{
    offerId: string;
    lender: PublicKey;                 // The lender's identifier
    borrower: PublicKey;                  // The borrower's identifier
    annualInterestRate: number;      // The annual interest rate (as a percentage or decimal)
    token: string;                     // The token/currency of the loan
    amount: number;                    // The lending amount offered
    period: number;                    // The lending period in days
    minPropertyValue: number;        // The minimum property value that has to be proved
    minIncomeMonthly: number;        // The minimum monthly income that has to be proved
    penalty: number;                   // The annual penalty interest rate (as a percentage or decimal)
    status: number;               // The current status of the offer

    constructor(
        offerId: string,
        lender: PublicKey,
        borrower: PublicKey,
        annualInterestRate: number,
        token: string,
        amount: number,
        period: number,
        minPropertyValue: number,
        minIncomeMonthly: number,
        penalty: number,
        status: number
    ) {
        super();
        this.offerId = offerId;
        this.lender = lender;
        this.borrower = borrower;
        this.annualInterestRate = annualInterestRate;
        this.token = token;
        this.amount = amount;
        this.period = period;
        this.minPropertyValue = minPropertyValue;
        this.minIncomeMonthly = minIncomeMonthly;
        this.penalty = penalty;
        this.status = status;
    }
}