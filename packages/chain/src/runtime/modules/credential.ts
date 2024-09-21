import { TokenId, UInt64} from "@proto-kit/library";
import { PublicKey, Struct, Field, MerkleMap, Poseidon, MerkleMapWitness } from "o1js";

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
}) { 
    public async addCredential(merkleMap: MerkleMap) {
        // const credential = new Credential({ identity, propertyValue, incomeMonthly, maskedAddress });
        const credentialHash = Poseidon.hash([this.identity, this.propertyValue, this.incomeMonthly, this.maskedAddress]);
        await merkleMap.set(this.identity, credentialHash);
    }
    // public async addCredential(merkleMap: MerkleMap, identity: Field, propertyValue: Field, incomeMonthly: Field, maskedAddress: Field) {
    //     const credential = new Credential({ identity, propertyValue, incomeMonthly, maskedAddress });
    //     const credentialHash = Poseidon.hash([credential.identity, credential.propertyValue, credential.incomeMonthly, credential.maskedAddress]);
    //     await merkleMap.set(identity, credentialHash);
    // }

    public async getWitness(merkleMap: MerkleMap) {
        const witness = await merkleMap.getWitness(this.identity);
        return witness;
    }

    public getCredentialHash() {
        const credentialHash = Poseidon.hash([this.identity, this.propertyValue, this.incomeMonthly, this.maskedAddress]);
        return credentialHash;
    }
}


