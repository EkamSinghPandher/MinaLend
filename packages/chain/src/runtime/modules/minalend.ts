import { Bool, PrivateKey, PublicKey, Provable,Field, Proof, ZkProgram } from "o1js";

import {
    RuntimeModule,
    runtimeModule,
    state,
    runtimeMethod,
} from "@proto-kit/module";
import { StateMap, assert, State } from "@proto-kit/protocol";
import { Offer } from "./offer"
import { Balance, TokenId, UInt112, UInt64 } from "@proto-kit/library";
import { inject } from "tsyringe";
import { Balances } from "./balances";
import { fromOffer, Loan } from "./loan";
import { Credential } from "./credential";
import { GenerateProof } from "./generateProof";

export class MyProof extends ZkProgram.Proof(GenerateProof) { }



interface MinaLendConfig {
    tokenId: TokenId
}

export const errors = {
    senderNotFrom: () => "Sender does not match 'from'",
    fromBalanceInsufficient: () => "From balance is insufficient",
};

// We use the following numbers to represent the following states:
// type OfferStatus = "offered" = 0 | "accepted" = 1 | "cleared" = 2 | "delayed" = 3 | "cancelled" = 4 ;

@runtimeModule()
export class MinaLendModule extends RuntimeModule<MinaLendConfig> {
    @state() public offers = StateMap.from(UInt64, Offer);
    @state() public loans = StateMap.from(UInt64, Loan);
    @state() public credentialCommit = State.from(Field);
    @state() public admin = State.from(PublicKey);



    @state() public pool: PublicKey;

    public constructor(@inject("Balances") public balances: Balances) {
        super();

        // generate an address for the liquidity pool without keeping the private key
        let pvk = PrivateKey.random();
        this.pool = PublicKey.fromPrivateKey(pvk);
    }

    public getPoolAddress() {
        return this.pool;
    }

    @runtimeMethod()
    public async createOffer(offer: Offer) {
        const tid = offer.tokenId;
        const from = this.transaction.sender.value;
        assert(from.equals(offer.lender), errors.senderNotFrom());

        const balance = await this.balances.getBalance(tid, from);
        assert(balance.greaterThanOrEqual(offer.amount), errors.fromBalanceInsufficient());

        // transfer tokens from lender to the pool
        await this.balances.transfer(tid, from, this.pool, offer.amount);

        // save offer
        await this.offers.set(offer.offerId, offer);
    }

    @runtimeMethod()
    public async cancelOffer(offerId: UInt64) {
        let offerResult = (await this.offers.get(offerId));
        assert(offerResult.isSome);
        let offer = offerResult.value;

        // Ensure the one cancelling the offer is the one who made the offer
        assert(this.transaction.sender.value.equals(offer.lender));

        // Make sure offer is unaccepted and valid
        assert(offer.status.equals(UInt64.from(0)));

        // Make sure the pool has sufficient tokens
        const poolBalance = await this.balances.getBalance(offer.tokenId, this.pool);
        assert(poolBalance.greaterThanOrEqual(offer.amount));

        offer.status = UInt64.from(4)
        await this.offers.set(offerId, offer);

        // transfer tokens from lender to the pool
        await this.balances.transfer(offer.tokenId, this.pool, offer.lender, offer.amount);
    }

    /*
    // UpdateOffer with Provable.if: it DOES NOT work! The transaction fails except for when the offers are identical.
    @runtimeMethod()
    public async updateOffer(offerId: UInt64, newOffer: Offer) {
        let offerResult = (await this.offers.get(offerId));
        assert(offerResult.isSome);
        assert(offerId.equals(newOffer.offerId));
        let oldOffer = offerResult.value;

        // Ensure the one updating the offer is the one who made the offer
        assert(this.transaction.sender.value.equals(oldOffer.lender));
        assert(newOffer.lender.equals(oldOffer.lender));

        // Make sure offer is unaccepted and valid
        assert(oldOffer.status.equals(UInt64.from(0)));
        assert(newOffer.status.equals(UInt64.from(0)));

        const cond = oldOffer.amount.greaterThan(newOffer.amount);
        const diff = Provable.if(
            cond,
            UInt64,
            oldOffer.amount.sub(newOffer.amount),
            newOffer.amount.sub(oldOffer.amount)
        );
        const from = Provable.if(
            cond,
            this.pool,
            newOffer.lender
        );
        const to = Provable.if(
            cond,
            newOffer.lender,
            this.pool
        );

        const d = UInt64.Unsafe.fromField(diff.value);
        await this.balances.transfer(newOffer.tokenId, from, to, d);
        await this.offers.set(offerId, newOffer);
    }
    */

    private async updateOfferChecks(offerId: UInt64, newOffer: Offer) {
        let offerResult = (await this.offers.get(offerId));
        assert(offerResult.isSome);
        assert(offerId.equals(newOffer.offerId));
        let oldOffer = offerResult.value;

        // Ensure the one updating the offer is the one who made the offer
        assert(this.transaction.sender.value.equals(oldOffer.lender));
        assert(newOffer.lender.equals(oldOffer.lender));

        // Make sure offer is unaccepted and valid
        assert(oldOffer.status.equals(UInt64.from(0)));
        assert(newOffer.status.equals(UInt64.from(0)));

        return oldOffer;
    }

    // We split updateOffer into up and down because Provable.if does not work!
    @runtimeMethod()
    public async updateOfferUp(offerId: UInt64, newOffer: Offer) {
        const oldOffer = await this.updateOfferChecks(offerId, newOffer);

        // Make sure the diff is positive
        assert(oldOffer.amount.lessThan(newOffer.amount));

        await this.balances.transfer(newOffer.tokenId, newOffer.lender, this.pool, newOffer.amount.sub(oldOffer.amount));
        await this.offers.set(offerId, newOffer);
    }

    @runtimeMethod()
    public async updateOfferDown(offerId: UInt64, newOffer: Offer) {
        const oldOffer = await this.updateOfferChecks(offerId, newOffer);

        // Make sure the diff is positive
        assert(newOffer.amount.lessThan(oldOffer.amount));

        await this.balances.transfer(newOffer.tokenId, this.pool, newOffer.lender, oldOffer.amount.sub(newOffer.amount));
        await this.offers.set(offerId, newOffer);
    }

    // TODO: VerificationKey should be stored in the contract
    // TODO: Debugging: the proof is not verified
    @runtimeMethod()
    public async acceptOfferWithProof(offerId: UInt64, borrower: PublicKey, proof: MyProof){

        //(await this.admin.get()).value)

        let offerResult = (await this.offers.get(offerId));
        assert(offerResult.isSome);
        let offer = offerResult.value;

        // check public input
        assert(proof.publicInput.address.equals(borrower), "Borrower does not match");
        assert(proof.publicInput.credentialCommitment.equals((await this.credentialCommit.get()).value), "Credential commitment does not match");
        assert(proof.publicInput.minPropertyValue.equals(offer.minPropertyValue.value), "Minimum property value does not match");
        assert(proof.publicInput.minIncomeMonthly.equals(offer.minIncomeMonthly.value), "Minimum income monthly does not match");

        // verify proof
        proof.verify();

        offer.status =  UInt64.from(1);
        // Make sure the pool has sufficient tokens
        const poolBalance = await this.balances.getBalance(offer.tokenId, this.pool);
        assert(poolBalance.greaterThanOrEqual(offer.amount));

        offer.status = UInt64.from(1);

        let loan = fromOffer(offer, borrower);
        await this.offers.set(offerId, offer);
        await this.loans.set(loan.loanId, loan);

        // transfer tokens from pool to borrower
        await this.balances.transfer(offer.tokenId, this.pool, borrower, offer.amount);
    }

    @runtimeMethod()
    public async acceptOffer(offerId: UInt64, borrower: PublicKey) {
        let offerResult = (await this.offers.get(offerId));
        assert(offerResult.isSome);
        let offer = offerResult.value;

        offer.status =  UInt64.from(1);
        // Make sure the pool has sufficient tokens
        const poolBalance = await this.balances.getBalance(offer.tokenId, this.pool);
        assert(poolBalance.greaterThanOrEqual(offer.amount));

        offer.status = UInt64.from(1);

        let loan = fromOffer(offer, borrower);
        await this.offers.set(offerId, offer);
        await this.loans.set(loan.loanId, loan);

        // transfer tokens from pool to borrower
        await this.balances.transfer(offer.tokenId, this.pool, borrower, offer.amount);
    }

    @runtimeMethod()
    public async repayLoan(loanId: UInt64, amount: UInt64) {
        assert(amount.greaterThan(UInt64.from(0)));

        let loanResult = await this.loans.get(loanId);
        assert(loanResult.isSome);
        let loan = loanResult.value;

        let amountRemaining = loan.amountToPay.sub(loan.amountPaid);
        assert(amountRemaining.greaterThanOrEqual(amount));
        assert(this.transaction.sender.value.equals(loan.borrower));

        let offerResult = await this.offers.get(loanId);
        assert(offerResult.isSome);
        let offer = offerResult.value;

        await this.balances.transfer(this.config.tokenId, loan.borrower, offer.lender, amount);

        loan.amountPaid = loan.amountPaid.add(amount);

        await this.loans.set(loan.loanId, loan);
    }

    @runtimeMethod()
    public async finalizeLoan(loanId: UInt64) {
        let loanResult = await this.loans.get(loanId);
        assert(loanResult.isSome);
        let loan = loanResult.value;

        assert(loan.amountPaid.equals(loan.amountToPay));

        loan.isCompleted = Bool(true);
        await this.loans.set(loan.loanId, loan);

        let offerResult = await this.offers.get(loanId);
        assert(offerResult.isSome);
        let offer = offerResult.value;
        offer.status = UInt64.from(2);  // 2 == completed
        await this.offers.set(offer.offerId, offer);
    }

    // admin functions
    @runtimeMethod()
    public async updateCredentialCommit(credentialCommit: Field) {
        // assert(this.transaction.sender.value.equals((await this.admin.get()).value));
        this.credentialCommit.set(credentialCommit);
    }

    @runtimeMethod()
    public async updateAdmin(admin: PublicKey) {
        assert(this.transaction.sender.value.equals((await this.admin.get()).value));
        this.admin.set(admin);
    }
}