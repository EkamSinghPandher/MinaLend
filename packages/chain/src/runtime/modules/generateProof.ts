import { Field, SelfProof, ZkProgram, verify, MerkleMapWitness, Struct, Poseidon, PublicKey } from 'o1js';
import { Credential } from "./credential";

export class CredentialPublicInput extends Struct({
  credentialCommitment: Field,
  minPropertyValue: Field,
  minIncomeMonthly: Field,
  address: PublicKey,
  lenderNonceHash: Field,
  nullifier: Field,
}) {}

export const GenerateProof = ZkProgram({
  name: 'generate-proof',
  publicInput: CredentialPublicInput,

  methods: {
    verifyCredential: {
      privateInputs: [MerkleMapWitness, Credential, Field, Field],

      async method(publicInput: CredentialPublicInput,  witness: MerkleMapWitness, credential: Credential, borrowerNonce: Field, lenderNonce: Field) {
        // check if the credential is valid
        const credentialHash = credential.getCredentialHash();
        const [computedRoot, computedKey] = await witness.computeRootAndKeyV2(credentialHash);
        computedKey.assertEquals(credential.identity);
        publicInput.credentialCommitment.assertEquals(computedRoot);

        // check if the property value and income monthly are greater than the minimum values
        credential.propertyValue.assertGreaterThanOrEqual(publicInput.minPropertyValue);
        credential.incomeMonthly.assertGreaterThanOrEqual(publicInput.minIncomeMonthly);
        
        // check if the masked address is correct
        const maskedAddress = Poseidon.hash([...publicInput.address.toFields(), borrowerNonce]);
        credential.maskedAddress.assertEquals(maskedAddress);

        // check if the credential is not blacklisted
        credential.blacklisted.assertFalse();

        // check if the lender nonce hash is correct
        const lenderNonceHash = Poseidon.hash([lenderNonce]);
        publicInput.lenderNonceHash.assertEquals(lenderNonceHash);

        // check if the nullifier is correct
        const nullifier = Poseidon.hash([credential.identity, lenderNonce]);
        publicInput.nullifier.assertEquals(nullifier);
      },
    },

  },
});

