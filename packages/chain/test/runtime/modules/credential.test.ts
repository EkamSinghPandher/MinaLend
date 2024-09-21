import { AccountUpdate, Mina, PrivateKey, PublicKey, MerkleMap, Field, verify, Poseidon } from 'o1js';
import { Credential } from "../../../src/runtime/modules/credential";
import { GenerateProof } from "../../../src/runtime/modules/generateProof";


describe('Test credential', () => {
  it('should generate a zk merkle proof and verify it', async () => {
    const { verificationKey } = await GenerateProof.compile();

    const merkleMap = new MerkleMap();

    const credential = new Credential({
        identity: Field(1),
        propertyValue: Field(2),
        incomeMonthly: Field(3),
        maskedAddress: Field(4),
    });

    const credentialHash = credential.getCredentialHash();

    await credential.addCredential(merkleMap);

    const witness = await credential.getWitness(merkleMap);

    const root = await merkleMap.getRoot();

  }, 1_000_000);
});