import { create } from "zustand";

interface ProofStore {
  proof: string;
  setProof: (proof: string) => void;
  nullifier: string;
  setNullifier: (nullifier: string) => void;
}

export const useProofStore = create<ProofStore>((set) => ({
  proof: "",
  setProof: (proof: string) => set({ proof }),
  nullifier: "",
  setNullifier: (nullifier: string) => set({ nullifier }),
}));
