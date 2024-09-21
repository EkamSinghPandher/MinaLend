import { AccountUpdate, Mina, PrivateKey, PublicKey, MerkleMap, Field, verify } from 'o1js';
import { GenerateMerkleProof } from "../../../src/runtime/modules/GenerateMerkleProof";

// let proofsEnabled = false;

describe('Test GenerateMerkleProof', () => {
  it('should generate a zk merkle proof and verify it', async () => {
    console.log('generating verification key');
    const { verificationKey } = await GenerateMerkleProof.compile();

    const merkleMap = new MerkleMap();

    const key = Field(1);
    const value = Field(2);

    await merkleMap.set(key, value);

    const root = await merkleMap.getRoot();

    const witness = await merkleMap.getWitness(key);
    const proof = await GenerateMerkleProof.verifyCredential(
        root,
        witness,
        key,
        value,
    );

    const ok = await verify(proof, verificationKey);
    expect(ok).toBe(true);
    console.log('ok', ok);



  }, 1_000_000);
});