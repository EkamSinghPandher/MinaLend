import { Bool, Provable, PublicKey } from "o1js";

import {
    RuntimeModule,
    runtimeModule,
    state,
    runtimeMethod,
} from "@proto-kit/module";
import { State, StateMap, Option, assert } from "@proto-kit/protocol";
import { Offer } from "./offer"
import { UInt64 } from "@proto-kit/library";
import { fromOffer, Loan } from "./loan";

interface MinaLendConfig {

}

// We use the following numbers to represent the following states:
// type OfferStatus = "offered" = 0 | "accepted" = 1 | "cleared" = 2 | "delayed" = 3 | "cancelled" = 4 ;


@runtimeModule()
export class MinaLendModule extends RuntimeModule<MinaLendConfig> {
    @state() public offers = StateMap.from(UInt64, Offer);
    @state() public loans = StateMap.from(UInt64, Loan);

    // TODO: Deduct loan amount from the lender @Dumi
    @runtimeMethod()
    public async createOffer(o: Offer) {
        await this.offers.set(o.offerId, o);
    }

    // TODO: Return the loan amount to the lender @Dumi
    @runtimeMethod()
    public async cancelOffer(offerId: UInt64) {
        let offerResult = (await this.offers.get(offerId));
        assert(offerResult.isSome);
        let offer = offerResult.value;

        // Ensure the one cancelling the offer is the one who made the offer
        assert(this.transaction.sender.value.equals(offer.lender));

        // Make sure offer is unaccepted and valid
        assert(offer.status.equals(UInt64.from(0)));

        offer.status = UInt64.from(4)
        await this.offers.set(offerId, offer);
    }

    // TODO: If loan amount changes, either return or top up more assets @Dumi
    @runtimeMethod()
    public async updateOffer(offerId: UInt64, o: Offer) {
        let offerResult = (await this.offers.get(offerId));
        assert(offerResult.isSome);
        assert(offerId.equals(o.offerId));
        let offer = offerResult.value;

        // Ensure the one updating the offer is the one who made the offer
        assert(this.transaction.sender.value.equals(offer.lender));

        // Make sure offer is unaccepted and valid
        assert(offer.status.equals(UInt64.from(0)));

        await this.offers.set(offerId, o);
    }

    // TODO: Verify Proof of assets @Jason
    // TODO: Deduct the loan amount from pool and give it to the borrower @Dumi
    @runtimeMethod()
    public async acceptOffer(offerId: UInt64, borrower: PublicKey){
        let offerResult = (await this.offers.get(offerId));
        assert(offerResult.isSome);

        let offer = offerResult.value;
        offer.status =  UInt64.from(1);
        offer.borrower = borrower;

        let loan = fromOffer(offer);
        await this.offers.set(offerId, offer);
        await this.loans.set(loan.loanId, loan);
    }


    // TODO: Deduct the loan amount from borrower and transfer it to the sender. @Dumi
    @runtimeMethod()
    public async repayLoan(loanId: UInt64, amount: UInt64){
        let loanResult = await this.loans.get(loanId);
        assert(loanResult.isSome);
        let loan = loanResult.value;

        let amountRemainingField = loan.offer.amount.value.add(loan.interestAdded.value).sub(loan.amountPaid.value);
        console.log(amountRemainingField.value);
        let amountRemaining = new UInt64({value: amountRemainingField});
        

        // loan repaid 
        if (amount.value.equals(amountRemaining.value)) {
            console.log("this happens")
            // set offer to be cleared
            let offerId = loan.offer.offerId;
            let offerResult = await this.offers.get(offerId);
            assert(offerResult.isSome);
            let offer = offerResult.value;
            offer.status = UInt64.from(2);
            await this.offers.set(offerId, offer);

            // Set loan amount paid to be fulfilled
            loan.amountPaid = new UInt64({value: loan.amountPaid.value.add(amount.value)});
            loan.isCompleted = Bool(true);

        // too much paid only deduct what is owed (amount remaining)
        } else if (amount.value.greaterThan(amountRemaining.value)) {
            console.log("this happens2")
            // set offer to be cleared
            let offerId = loan.offer.offerId;
            let offerResult = await this.offers.get(offerId);
            assert(offerResult.isSome);
            let offer = offerResult.value;
            offer.status = UInt64.from(2);
            await this.offers.set(offerId, offer);

            // Set loan amount paid to be fulfilled
            loan.amountPaid = new UInt64({value: loan.amountPaid.value.add(amountRemaining.value)});
            loan.isCompleted = Bool(true);

        // Less than amount left paid
        } else {
            // Set loan amount paid to be fulfilled
            loan.amountPaid = new UInt64({value: loan.amountPaid.value.add(amount.value)});
        }

        await this.loans.set(loanId, loan);
    }
}