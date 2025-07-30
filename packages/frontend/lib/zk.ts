import { Noir } from "@noir-lang/noir_js";
import { IMT, IMTNode } from "@zk-kit/imt";
import circuit from "@/public/circuit.json";

let bbsync: any = null;
let honk: any = null;
let noir: any = null;
let Fr: any = null;

async function initializeZKLibraries() {
  if (!bbsync) {
    try {
      const {
        UltraHonkBackend,
        BarretenbergSync,
        Fr: FrClass,
      } = await import("@aztec/bb.js");
      bbsync = await BarretenbergSync.initSingleton();
      honk = new UltraHonkBackend(circuit.bytecode);
      noir = new Noir(circuit as any);
      Fr = FrClass;
      await noir.init();
    } catch (error) {
      console.error("Failed to initialize ZK libraries:", error);
      throw new Error("ZK 라이브러리 초기화에 실패했습니다.");
    }
  }
  return { bbsync, honk, noir, Fr };
}

const encoder = new TextEncoder();

export async function makeCommitment(password: string, uuid: string) {
  try {
    const { bbsync: bb, Fr: FrClass } = await initializeZKLibraries();

    const passwordBufferDigest = FrClass.fromBufferReduce(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", encoder.encode(password))
      )
    );
    const uuidBuffer = FrClass.fromBufferReduce(encoder.encode(uuid));

    return bb.poseidon2Hash([passwordBufferDigest, uuidBuffer]).toString();
  } catch (error) {
    console.error("makeCommitment error:", error);
    throw new Error("커밋먼트 생성에 실패했습니다.");
  }
}

export async function makeNullifier(
  password: string,
  uuid: string,
  survyId: number
) {
  try {
    const { bbsync: bb, Fr: FrClass } = await initializeZKLibraries();

    const uuidBuffer = FrClass.fromBufferReduce(encoder.encode(uuid));
    const passwordBufferDigest = FrClass.fromBufferReduce(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", encoder.encode(password))
      )
    );
    const surveyId = new FrClass(BigInt(survyId));

    return bb
      .poseidon2Hash([passwordBufferDigest, uuidBuffer, surveyId])
      .toString();
  } catch (error) {
    console.error("makeNullifier error:", error);
    throw new Error("널리파이어 생성에 실패했습니다.");
  }
}

export async function generateProof(
  password: string,
  uuid: string,
  surveyId: number,
  leaves: string[]
) {
  try {
    const {
      bbsync: bb,
      honk: h,
      noir: n,
      Fr: FrClass,
    } = await initializeZKLibraries();

    const hashFn = (inputs: IMTNode[]) => {
      return bb
        .poseidon2Hash(inputs.map((input) => new FrClass(BigInt(input))))
        .toString();
    };
    const commitment = await makeCommitment(password, uuid);
    const nullifier = await makeNullifier(password, uuid, surveyId);
    const passwordBufferDigest = FrClass.fromBufferReduce(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", encoder.encode(password))
      )
    );
    const uuidBuffer = FrClass.fromBufferReduce(encoder.encode(uuid));

    const mt = new IMT(hashFn, 10, BigInt(0), 2, leaves);
    const merkleIndex = mt.indexOf(commitment);
    const { root, siblings } = mt.createProof(merkleIndex);
    const merkleProof = siblings.map((sibling: any) => sibling.toString());

    const { witness } = await n.execute({
      secret: passwordBufferDigest.toString(),
      uuid: uuidBuffer.toString(),
      merkle_index: merkleIndex,
      merkle_proof: merkleProof,
      survey_id: BigInt(surveyId).toString(),
      nulifier: nullifier,
      merkle_root: root.toString(),
    });

    const proofData = await h.generateProof(witness);
    return {
      proof: proofData.proof.toString(),
      nullifier,
      merkleProof,
      commitment,
    };
  } catch (error) {
    console.error("generateProof error:", error);
    throw new Error("프루프 생성에 실패했습니다.");
  }
}
