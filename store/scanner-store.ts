import { create } from "zustand"
import type { ScanResult } from "@/lib/types"

interface ScannerStore {
  isScanning: boolean
  currentFrame: string | null
  scanResult: ScanResult | null
  setScanning: (scanning: boolean) => void
  setCurrentFrame: (frame: string | null) => void
  setScanResult: (result: ScanResult | null) => void
  reset: () => void
}

export const useScannerStore = create<ScannerStore>((set) => ({
  isScanning: false,
  currentFrame: null,
  scanResult: null,
  setScanning: (scanning) => set({ isScanning: scanning }),
  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  setScanResult: (result) => set({ scanResult: result }),
  reset: () => set({ isScanning: false, currentFrame: null, scanResult: null }),
}))
