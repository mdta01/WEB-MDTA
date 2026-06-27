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
  isAdminMode: boolean
  isAdminLoggedIn: boolean
  adminName: string
  searchQuery: string
  mobileMenuOpen: boolean
  
  setCurrentPage: (page: PageSection) => void
  setAdminMode: (mode: boolean) => void
  setAdminLoggedIn: (loggedIn: boolean, name?: string) => void
  setSearchQuery: (query: string) => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'beranda',
  isAdminMode: false,
  isAdminLoggedIn: false,
  adminName: '',
  searchQuery: '',
  mobileMenuOpen: false,

  setCurrentPage: (page) => set({ currentPage: page, mobileMenuOpen: false }),
  setAdminMode: (mode) => set({ isAdminMode: mode }),
  setAdminLoggedIn: (loggedIn, name) => set({ isAdminLoggedIn: loggedIn, adminName: name || '' }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}))
