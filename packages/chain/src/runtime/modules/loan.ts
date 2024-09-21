import { TokenId, UInt64 } from "@proto-kit/library";
import { PublicKey, Struct } from "o1js";
import { Offer } from "./offer";

export class Loan extends Struct({
    loanId: UInt64,
    offer: Offer,
    borrower: PublicKey,
    amountPaid: UInt64
}) { }


export function fromOffer(o: Offer){
    let loanId = o.offerId;
    let offer = o;
    let borrower = o.borrower;
    let amountPaid = UInt64.from(0);

    return new Loan({loanId, offer, borrower, amountPaid});
}