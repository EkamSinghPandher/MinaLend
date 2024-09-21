import { TokenId, UInt64} from "@proto-kit/library";
import { PublicKey, Struct, Field, MerkleMap, Poseidon, MerkleMapWitness, Bool } from "o1js";

import {
    RuntimeModule,
    runtimeModule,
    state,
    runtimeMethod,
} from "@proto-kit/module";
import { State, StateMap, Option, assert } from "@proto-kit/protocol";
import { Offer } from "./offer"

interface CredentialConfig {

}

export class Credential extends Struct({
    identity: Field,
    propertyValue: Field,
    incomeMonthly: Field,
    maskedAddress: Field,   // maskedAddress = hash(address, nonce)
    blacklisted: Bool,
}) { 
    public async addCredential(merkleMap: MerkleMap) {
        // const credential = new Credential({ identity, propertyValue, incomeMonthly, maskedAddress });
        const credentialHash = Poseidon.hash([this.identity, this.propertyValue, this.incomeMonthly, this.maskedAddress]);
        await merkleMap.set(this.identity, credentialHash);
    }

    public async getWitness(merkleMap: MerkleMap) {
        const witness = await merkleMap.getWitness(this.identity);
        return witness;
    }

    public getCredentialHash() {
        const credentialHash = Poseidon.hash([this.identity, this.propertyValue, this.incomeMonthly, this.maskedAddress]);
        return credentialHash;
    }
}

// @runtimeModule()
// export class CredentialModule extends RuntimeModule<CredentialConfig> {
//     @state() public credentialCommit = State.from(Field);
//     @state() public admin = State.from(PublicKey);

//     @runtimeMethod()
//     public async updateCredentialCommit(credentialCommit: Field) {
//         assert(this.transaction.sender.value.equals((await this.admin.get()).value));
//         this.credentialCommit.set(credentialCommit);
//     }

//     @runtimeMethod()
//     public async updateAdmin(admin: PublicKey) {
//         assert(this.transaction.sender.value.equals((await this.admin.get()).value));
//         this.admin.set(admin);
//     }
// }


