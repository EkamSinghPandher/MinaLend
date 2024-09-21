import { Field, SelfProof, ZkProgram, verify, MerkleMapWitness, Struct, Poseidon, PublicKey } from 'o1js';
import { Credential } from "./credential";

export class CredentialPublicInput extends Struct({
  credentialCommitment: Field,
  minPropertyValue: Field,
  minIncomeMonthly: Field,
  address: PublicKey,
}) {}

export const GenerateProof = ZkProgram({
  name: 'generate-proof',
  publicInput: CredentialPublicInput,

  methods: {
    verifyCredential: {
      privateInputs: [MerkleMapWitness, Credential, Field],

      async method(publicInput: CredentialPublicInput,  witness: MerkleMapWitness, credential: Credential, nonce: Field) {
        // check if the credential is valid
        const credentialHash = credential.getCredentialHash();
        const [computedRoot, computedKey] = await witness.computeRootAndKeyV2(credentialHash);
        computedKey.assertEquals(credential.identity);
        publicInput.credentialCommitment.assertEquals(computedRoot);

        // check if the property value and income monthly are greater than the minimum values
        credential.propertyValue.assertGreaterThanOrEqual(publicInput.minPropertyValue);
        credential.incomeMonthly.assertGreaterThanOrEqual(publicInput.minIncomeMonthly);
        
        // check if the masked address is correct
        const maskedAddress = Poseidon.hash([...publicInput.address.toFields(), nonce]);
        credential.maskedAddress.assertEquals(maskedAddress);
      },
    },

  },
});

