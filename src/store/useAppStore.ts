import { create } from 'zustand'

export type PageSection = 
  | 'beranda' 
  | 'profil' 
  | 'program' 
  | 'berita' 
  | 'prestasi' 
  | 'galeri' 
  | 'pengumuman' 
  | 'ppdb' 
  | 'download' 
  | 'dakwah' 
  | 'kelembagaan' 
  | 'alumni' 
  | 'wali-santri' 
  | 'kontak'
  | 'faq'
  | 'search'

interface AppState {
  currentPage: PageSection
  searchQuery: string
  mobileMenuOpen: boolean
  
  setCurrentPage: (page: PageSection) => void
  setSearchQuery: (query: string) => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'beranda',
  searchQuery: '',
  mobileMenuOpen: false,

  setCurrentPage: (page) => set({ currentPage: page, mobileMenuOpen: false }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}))
