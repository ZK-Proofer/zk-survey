import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend, BarretenbergSync, Fr } from "@aztec/bb.js";
import { IMT, IMTNode } from "@zk-kit/imt";
import circuit from "@/public/circuit.json";

const noir = new Noir(circuit as any);
await noir.init();
const bbsync = await BarretenbergSync.initSingleton();
const encoder = new TextEncoder();
const honk = new UltraHonkBackend(circuit.bytecode);

export async function makeCommitment(password: string, uuid: string) {
  const passwordBufferDigest = Fr.fromBufferReduce(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(password))
    )
  );
  const uuidBuffer = Fr.fromBufferReduce(encoder.encode(uuid));

  return bbsync.poseidon2Hash([passwordBufferDigest, uuidBuffer]).toString();
}

export async function makeNullifier(
  password: string,
  uuid: string,
  survyId: number
) {
  const uuidBuffer = Fr.fromBufferReduce(encoder.encode(uuid));
  const passwordBufferDigest = Fr.fromBufferReduce(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(password))
    )
  );
  const surveyId = new Fr(BigInt(survyId));

  return bbsync
    .poseidon2Hash([passwordBufferDigest, uuidBuffer, surveyId])
    .toString();
}

export async function generateProof(
  password: string,
  uuid: string,
  surveyId: number,
  leaves: string[]
) {
  const hashFn = (inputs: IMTNode[]) => {
    return bbsync
      .poseidon2Hash(inputs.map((input) => new Fr(BigInt(input))))
      .toString();
  };
  const commitment = await makeCommitment(password, uuid);
  const nulifier = await makeNullifier(password, uuid, surveyId);
  const passwordBufferDigest = Fr.fromBufferReduce(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(password))
    )
  );
  const uuidBuffer = Fr.fromBufferReduce(encoder.encode(uuid));

  const mt = new IMT(hashFn, 10, BigInt(0), 2, leaves);
  const merkleIndex = mt.indexOf(commitment);
  const { root, siblings } = mt.createProof(merkleIndex);
  const merkleProof = siblings.map((sibling: Fr) => sibling.toString());

  const { witness } = await noir.execute({
    secret: passwordBufferDigest.toString(),
    uuid: uuidBuffer.toString(),
    merkle_index: merkleIndex,
    merkle_proof: merkleProof,
    survey_id: BigInt(surveyId).toString(),
    nulifier: nulifier,
    merkle_root: root.toString(),
  });

  const proofData = await honk.generateProof(witness);
  return { proof: proofData.proof.toString(), nulifier, merkleProof };
}
