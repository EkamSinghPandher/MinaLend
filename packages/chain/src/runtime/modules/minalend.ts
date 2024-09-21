import { Bool, PublicKey, Field, Proof, ZkProgram } from "o1js";

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
import { inject } from "tsyringe";
import { Credential } from "./credential";
import { GenerateProof } from "./generateProof";

export class MyProof extends ZkProgram.Proof(GenerateProof) { }



interface MinaLendConfig {

}

// We use the following numbers to represent the following states:
// type OfferStatus = "offered" = 0 | "accepted" = 1 | "cleared" = 2 | "delayed" = 3 | "cancelled" = 4 ;


@runtimeModule()
export class MinaLendModule extends RuntimeModule<MinaLendConfig> {
    @state() public offers = StateMap.from(UInt64, Offer);
    @state() public loans = StateMap.from(UInt64, Loan);
    @state() public credentialCommit = State.from(Field);
    @state() public admin = State.from(PublicKey);



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
    // TODO: VerificationKey should be stored in the contract
    @runtimeMethod()
    public async acceptOffer(offerId: UInt64, borrower: PublicKey, proof: MyProof){

        //(await this.admin.get()).value)

        let offerResult = (await this.offers.get(offerId));
        assert(offerResult.isSome);
        let offer = offerResult.value;

        // check public input
        assert(proof.publicInput.address.equals(borrower));
        assert(proof.publicInput.credentialCommitment.equals((await this.credentialCommit.get()).value));
        assert(proof.publicInput.minPropertyValue.equals(offer.minPropertyValue.value));
        assert(proof.publicInput.minIncomeMonthly.equals(offer.minIncomeMonthly.value));

        // verify proof 
        proof.verify();

        offer.status =  UInt64.from(1);
        offer.borrower = borrower;

        let loan = fromOffer(offer);
        await this.offers.set(offerId, offer);
        await this.loans.set(loan.loanId, loan);
    }

    // admin functions
    @runtimeMethod()
    public async updateCredentialCommit(credentialCommit: Field) {
        assert(this.transaction.sender.value.equals((await this.admin.get()).value));
        this.credentialCommit.set(credentialCommit);
    }

    @runtimeMethod()
    public async updateAdmin(admin: PublicKey) {
        assert(this.transaction.sender.value.equals((await this.admin.get()).value));
        this.admin.set(admin);
    }
}