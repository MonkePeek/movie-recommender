import type { Movie, SearchMoviesResponse } from "../types/movie";

const API_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w342";

// Raw shape returned by TMDB, kept separate from our normalized Movie type
// so a TMDB API change doesn't ripple through every component that uses Movie.
interface RawMovieResult {
  id: number;
  title: string;
  release_date: string | null;
  poster_path: string | null;
  overview: string | null;
  genre_ids: number[] | null;
  vote_average: number | null;
}

interface RawDiscoverResponse {
  page: number;
  results: RawMovieResult[];
  total_pages: number;
  total_results: number;
}

function normalizeMovie(raw: RawMovieResult): Movie {
  return {
    id: raw.id,
    title: raw.title,
    year: raw.release_date ? Number(raw.release_date.slice(0, 4)) : null,
    posterUrl: raw.poster_path ? `${IMAGE_BASE_URL}${raw.poster_path}` : null,
    overview: raw.overview ?? "",
    genreIds: raw.genre_ids ?? [],
    voteAverage: raw.vote_average ?? null,
  };
}

export interface DiscoverFilters {
  genre?: number;
  yearFrom?: number;
  yearTo?: number;
  ratingMin?: number;
  // TMDB person ID, not a name. See searchPerson.ts, which resolves a
  // typed actor name to this ID before it ever reaches discoverMovies.
  castId?: number;
  sort?: "rating" | "release_date" | "popularity";
  page?: number;
}

// Maps our UI-friendly sort names to the exact string TMDB's API expects.
const SORT_MAP: Record<NonNullable<DiscoverFilters["sort"]>, string> = {
  rating: "vote_average.desc",
  release_date: "primary_release_date.desc",
  popularity: "popularity.desc",
};

export async function discoverMovies(
  filters: DiscoverFilters,
  signal?: AbortSignal,
): Promise<SearchMoviesResponse> {
  // Read the key inside the function (not at module scope) so tests can
  // stub VITE_TMDB_API_KEY via vi.stubEnv before this ever runs.
  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  if (!API_KEY) {
    throw new Error(
      "Missing VITE_TMDB_API_KEY (set it in .env as VITE_TMDB_API_KEY=... and restart Vite).",
    );
  }

  const url = new URL(`${API_BASE_URL}/discover/movie`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("sort_by", SORT_MAP[filters.sort ?? "popularity"]);

  // Each filter is only added if set, so an empty FilterPanel produces an
  // unfiltered "popular movies" query rather than an impossible one.
  if (filters.genre) {url.searchParams.set("with_genres", String(filters.genre))};
  // TMDB has no "year range" param, so a from/to range is built as two
  // separate date-boundary filters spanning Jan 1 to Dec 31 of each year.
  if (filters.yearFrom) {url.searchParams.set("primary_release_date.gte", `${filters.yearFrom}-01-01`)};
  if (filters.yearTo) {url.searchParams.set("primary_release_date.lte", `${filters.yearTo}-12-31`)};
  if (filters.ratingMin) {url.searchParams.set("vote_average.gte", String(filters.ratingMin))};
  if (filters.castId) {url.searchParams.set("with_cast", String(filters.castId))};
  if (filters.page) {url.searchParams.set("page", String(filters.page))};

  const response = await fetch(url.toString(), { signal });

  if (!response.ok) {
    throw new Error(`Discover failed with status ${response.status}`);
  }

  const data: RawDiscoverResponse = await response.json();

  return {
    results: data.results.map(normalizeMovie),
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}