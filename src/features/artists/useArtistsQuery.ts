import { useQuery } from '@tanstack/react-query'
import {
  fetchArtistsPage,
  fetchBootstrap,
  fetchFilterOptions,
  fetchStats,
  type ArtistFilters,
} from '../../api/artists'

export const artistsKeys = {
  all: ['artists'] as const,
  bootstrap: (filters: ArtistFilters) => [...artistsKeys.all, 'bootstrap', filters] as const,
  list: (filters: ArtistFilters) => [...artistsKeys.all, 'list', filters] as const,
  stats: () => [...artistsKeys.all, 'stats'] as const,
  filters: () => [...artistsKeys.all, 'filters'] as const,
}

export const useArtistsBootstrap = (filters: ArtistFilters, enabled = true) =>
  useQuery({
    queryKey: artistsKeys.bootstrap(filters),
    queryFn: () => fetchBootstrap(filters),
    enabled,
    staleTime: 30_000,
  })

export const useArtistsPage = (filters: ArtistFilters, enabled = true) =>
  useQuery({
    queryKey: artistsKeys.list(filters),
    queryFn: () => fetchArtistsPage(filters),
    enabled,
    placeholderData: (previous) => previous,
    staleTime: 15_000,
  })

export const useArtistStats = (enabled = true) =>
  useQuery({
    queryKey: artistsKeys.stats(),
    queryFn: fetchStats,
    enabled,
    staleTime: 30_000,
  })

export const useArtistFilterOptions = (enabled = true) =>
  useQuery({
    queryKey: artistsKeys.filters(),
    queryFn: fetchFilterOptions,
    enabled,
    staleTime: 120_000,
  })
