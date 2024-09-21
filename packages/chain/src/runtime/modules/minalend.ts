import { PublicKey } from "o1js";

import {
    RuntimeModule,
    runtimeModule,
    state,
    runtimeMethod,
} from "@proto-kit/module";
import { State, StateMap, Option, assert } from "@proto-kit/protocol";
import { Offer } from "./offer"
import { UInt64 } from "@proto-kit/library";

interface MinaLendConfig {

}

// We use the following numbers to represent the following states:
// type OfferStatus = "offered" = 0 | "accepted" = 1 | "cleared" = 2 | "delayed" = 3 | "cancelled" = 4 ;


@runtimeModule()
export class MinaLendModule extends RuntimeModule<MinaLendConfig> {
    @state() public offers = StateMap.from(UInt64, Offer);

    @runtimeMethod()
    public async createOffer(o: Offer) {
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