import { PublicKey, UInt64 } from "o1js";

import {
    RuntimeModule,
    runtimeModule,
    state,
    runtimeMethod,
} from "@proto-kit/module";
import { State, StateMap, Option, assert } from "@proto-kit/protocol";
import { Offer } from "./offer"

interface MinaLendConfig {

}

@runtimeModule()
export class MinaLendModule extends RuntimeModule<MinaLendConfig> {
    @state() public offers = StateMap.from(UInt64, Offer);

    @runtimeMethod()
    public async createOffer(o: Offer) {
        this.offers.set(o.offerId, o);
    }
}