import { TokenId, UInt64 } from "@proto-kit/library";
import { Bool, PublicKey, Struct } from "o1js";
import { Offer } from "./offer";

export class Loan extends Struct({
    loanId: UInt64,
    offer: Offer,
    borrower: PublicKey,
    amountPaid: UInt64,
    amountToPay: UInt64,    // offer.amount * (100 + offer.annualInterestRate) / 100 * offer.period / 365
    isCompleted: Bool
}) { }

export function fromOffer(o: Offer){
    let loanId = o.offerId;
    let offer = o;
    let borrower = o.borrower;
    let amountPaid = UInt64.from(0);
    let amountToPay = o.amount.mul(o.annualInterestRate.add(100)).mul(o.period).div(36500);
    let isCompleted = Bool(false);

    return new Loan({loanId, offer, borrower, amountPaid, amountToPay, isCompleted});
}