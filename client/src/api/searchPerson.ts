const API_BASE_URL = "https://api.themoviedb.org/3";
const PROFILE_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w185";

interface RawPersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string | null;
  popularity: number;
}

interface RawPersonSearchResponse {
  page: number;
  results: RawPersonResult[];
  total_pages: number;
  total_results: number;
}

export interface Person {
  id: number;
  name: string;
  profileUrl: string | null;
  knownFor: string | null;
}

function normalizePerson(raw: RawPersonResult): Person {
  return {
    id: raw.id,
    name: raw.name,
    profileUrl: raw.profile_path ? `${PROFILE_IMAGE_BASE_URL}${raw.profile_path}` : null,
    knownFor: raw.known_for_department,
  };
}

/**
 * Resolves a free-text actor name to a TMDB person ID + profile info.
 * Needed because discoverMovies' `castId` filter requires a numeric TMDB
 * person ID, not a name. FilterPanel calls this to look up candidates
 * as the user types, then passes the chosen person's id onward.
 */
export async function searchPerson(query: string, signal?: AbortSignal): Promise<Person[]> {
  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  if (!API_KEY) {
    throw new Error(
      "Missing VITE_TMDB_API_KEY (set it in .env as VITE_TMDB_API_KEY=... and restart Vite).",
    );
  }

  // Avoid firing a request (and burning TMDB's rate limit) for an empty
  // or whitespace-only query. The caller debounces, but this is a
  // second guard in case searchPerson is ever called directly.
  if (!query.trim()) return [];

  const url = new URL(`${API_BASE_URL}/search/person`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");

  const response = await fetch(url.toString(), { signal });

  if (!response.ok) {
    throw new Error(`Person search failed with status ${response.status}`);
  }

  const data: RawPersonSearchResponse = await response.json();

  // TMDB doesn't sort person search results by relevance in a way that
  // reliably surfaces the famous match first (e.g. searching "Chris"
  // could return an obscure crew member ahead of Chris Evans), so we
  // re-sort by popularity before returning suggestions to the UI.
  const sortedByPopularity = [...data.results].sort((a, b) => b.popularity - a.popularity);
  return sortedByPopularity.map(normalizePerson);
}