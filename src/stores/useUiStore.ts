import { create } from 'zustand'

type UiState = {
  vaultOpen: boolean
  commandOpen: boolean
  quickEditArtistId: string | null
  setVaultOpen: (open: boolean) => void
  toggleVault: () => void
  setCommandOpen: (open: boolean) => void
  setQuickEditArtistId: (id: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  vaultOpen: false,
  commandOpen: false,
  quickEditArtistId: null,
  setVaultOpen: (open) => set({ vaultOpen: open }),
  toggleVault: () => set((s) => ({ vaultOpen: !s.vaultOpen })),
  setCommandOpen: (open) => set({ commandOpen: open }),
  setQuickEditArtistId: (id) => set({ quickEditArtistId: id }),
}))
