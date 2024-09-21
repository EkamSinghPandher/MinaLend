import { PrivateKey, PublicKey } from "o1js";

import {
    RuntimeModule,
    runtimeModule,
    state,
    runtimeMethod,
} from "@proto-kit/module";
import { State, StateMap, Option, assert } from "@proto-kit/protocol";
import { Offer } from "./offer"
import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { inject } from "tsyringe";
import { Balances } from "./balances";

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
    public async createOffer(o: Offer) {
        const tid = o.tokenId;
        const from = this.transaction.sender.value;
        assert(from.equals(o.lender), errors.senderNotFrom());

        const balance = await this.balances.getBalance(tid, from);
        assert(balance.greaterThanOrEqual(o.amount), errors.fromBalanceInsufficient());

        // transfer tokens from lender to the pool
        await this.balances.transfer(tid, from, this.pool, o.amount);

        // save offer
        await this.offers.set(o.offerId, o);
    }

    @runtimeMethod()
    public async cancelOffer(offerId: UInt64) {
        let offerResult = (await this.offers.get(offerId));
        assert(offerResult.isSome);
        let offer = offerResult.value;
        offer.status = UInt64.from(4)
        await this.offers.set(offerId, offer);
    }

    @runtimeMethod()
    public async updateOffer(offerId: UInt64, o: Offer) {
        let offerExists = (await this.offers.get(offerId)).isSome;
        assert(offerExists);
        assert(offerId.equals(o.offerId));
        await this.offers.set(offerId, o);
    }
}