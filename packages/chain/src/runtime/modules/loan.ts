import { TokenId, UInt64 } from "@proto-kit/library";
import { Bool, PublicKey, Struct } from "o1js";
import { Offer } from "./offer";

export class Loan extends Struct({
    loanId: UInt64,         // Primary key. This is the same as the offerId of the accepted offer.
    borrower: PublicKey,    // The borrower's identifier.
    amountPaid: UInt64,     // Amount paid so far.
    amountToPay: UInt64,    // offer.amount * (100 + offer.annualInterestRate) / 100 * offer.period / 365
    isCompleted: Bool
}) { }

export function fromOffer(offer: Offer, borrower: PublicKey){
    let loanId = offer.offerId;
    let amountPaid = UInt64.from(0);
    let amountToPay = offer.amount.mul(offer.annualInterestRate.add(100)).mul(offer.period).div(36500);
    let isCompleted = Bool(false);

    return new Loan({loanId, borrower, amountPaid, amountToPay, isCompleted});
}