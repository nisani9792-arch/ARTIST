import { useQuery } from '@tanstack/react-query'
import {
  fetchArtistById,
  fetchArtistVersions,
  fetchArtistsPage,
  fetchBootstrap,
  fetchDuplicateGroups,
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
  detail: (id: string) => [...artistsKeys.all, 'detail', id] as const,
  versions: (id: string) => [...artistsKeys.all, 'versions', id] as const,
  duplicates: () => [...artistsKeys.all, 'duplicates'] as const,
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

export const useArtistDetail = (id: string | undefined) =>
  useQuery({
    queryKey: artistsKeys.detail(id ?? ''),
    queryFn: () => fetchArtistById(id!),
    enabled: Boolean(id),
    staleTime: 5_000,
  })

export const useArtistVersions = (id: string | undefined, enabled = true) =>
  useQuery({
    queryKey: artistsKeys.versions(id ?? ''),
    queryFn: () => fetchArtistVersions(id!),
    enabled: Boolean(id) && enabled,
    staleTime: 5_000,
  })

export const useDuplicateGroups = (enabled = false) =>
  useQuery({
    queryKey: artistsKeys.duplicates(),
    queryFn: fetchDuplicateGroups,
    enabled,
    staleTime: 30_000,
  })
