import { AccountUpdate, Mina, PrivateKey, PublicKey, MerkleMap, Field, verify, Poseidon } from 'o1js';
import { GenerateProof, CredentialPublicInput } from "../../../src/runtime/modules/generateProof";
import { Credential } from "../../../src/runtime/modules/credential";

// let proofsEnabled = false;

describe('Test GenerateMerkleProof', () => {
  it('should generate a zk merkle proof and verify it', async () => {
    const { verificationKey } = await GenerateProof.compile();

    const merkleMap = new MerkleMap();

    const bobPrivateKey = PrivateKey.random();
    const bobPublicKey = bobPrivateKey.toPublicKey();

    const nonce = Field(10);

    const maskedAddress = Poseidon.hash([...bobPublicKey.toFields(), nonce]);

    const credential = new Credential({
      identity: Field(1),
      propertyValue: Field(2),
      incomeMonthly: Field(3),
      maskedAddress: maskedAddress,
  });

    const minPropertyValue = Field(1);
    const minIncomeMonthly = Field(1);

    // generate a proof for the credential
    await credential.addCredential(merkleMap);
    const witness = await credential.getWitness(merkleMap);
    const root = await merkleMap.getRoot();

    const publicInput = new CredentialPublicInput({
        credentialCommitment: root,
        minPropertyValue,
        minIncomeMonthly,
        address: bobPublicKey,
    });

    const proof = await GenerateProof.verifyCredential(publicInput, witness, credential, nonce);
    const ok = await verify(proof, verificationKey);
    expect(ok).toBe(true);

  }, 1_000_000);
});