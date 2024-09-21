import { AccountUpdate, Mina, PrivateKey, PublicKey, MerkleMap, Field, verify, Poseidon } from 'o1js';
import { Credential } from "../../../src/runtime/modules/credential";
import { GenerateMerkleProof } from "../../../src/runtime/modules/GenerateMerkleProof";


describe('Test credential', () => {
  it('should generate a zk merkle proof and verify it', async () => {
    console.log('generating verification key');
    const { verificationKey } = await GenerateMerkleProof.compile();

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

    const proof = await GenerateMerkleProof.verifyCredential(
        root,
        witness,
        credential.identity,
        credentialHash,
    );

    const ok = await verify(proof, verificationKey);
    expect(ok).toBe(true);
    console.log('ok', ok);



  }, 1_000_000);
});