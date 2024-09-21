import { Field, SelfProof, ZkProgram, verify, MerkleMapWitness } from 'o1js';

export const GenerateMerkleProof = ZkProgram({
  name: 'generate-merkle-proof',
  publicInput: Field, // credential commitment

  methods: {
    verifyCredential: {
      privateInputs: [MerkleMapWitness, Field, Field],

      async method(publicInput: Field,  witness: MerkleMapWitness, key: Field, value: Field) {
        const [computedRoot, computedKey] = await witness.computeRootAndKeyV2(value);
        computedKey.assertEquals(key);
        publicInput.assertEquals(computedRoot);
      },
    },

  },
});

