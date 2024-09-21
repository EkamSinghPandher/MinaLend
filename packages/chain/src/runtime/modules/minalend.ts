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

@runtimeModule()
export class MinaLendModule extends RuntimeModule<MinaLendConfig> {
    @state() public offers = StateMap.from(UInt64, Offer);

    @runtimeMethod()
    public async createOffer(o: Offer) {
        await this.offers.set(o.offerId, o);
    }
}