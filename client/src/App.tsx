import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import SearchBar from "./components/SearchBar.tsx";
import SearchResultsList from "./components/SearchResultsList.tsx";
import FilterPanel from "./components/FilterPanel.tsx";
import { useMovieResults } from "./hooks/useMovieResults.ts";
import type { Movie } from "./types/movie.ts";
import type { DiscoverFilters } from "./api/discoverMovies";
import RandomButton from "./components/RandomButton.tsx";

function App() {
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const [query, setQuery] = useState<string>(() => {
    const savedQuery = sessionStorage.getItem("movieSearchQuery");
    if (!savedQuery) {
      return "";
    }

    try {
      const parsed = JSON.parse(savedQuery);

      if (typeof parsed === "string" && /^[^<>]*$/.test(parsed)) {
        return parsed;
      }
      return "";
    } catch {
      return "";
    }
  });

  const [filters, setFilters] = useState<DiscoverFilters>(() => {
    const savedFilters = sessionStorage.getItem("movieSearchFilters");
    if (!savedFilters) {
      return {};
    }

    try {
      const parsed = JSON.parse(savedFilters);
      const safeFilters: DiscoverFilters = {};

      if (typeof parsed.genre === "number") {
        safeFilters.genre = parsed.genre;
      }
      if (typeof parsed.yearFrom === "number") {
        safeFilters.yearFrom = parsed.yearFrom;
      }
      if (typeof parsed.yearTo === "number") {
        safeFilters.yearTo = parsed.yearTo;
      }
      if (typeof parsed.ratingMin === "number") {
        safeFilters.ratingMin = parsed.ratingMin;
      }
      if (typeof parsed.castId === "number") {
        safeFilters.castId = parsed.castId;
      }

      if (["popularity", "rating", "release_date"].includes(parsed.sort)) {
        safeFilters.sort = parsed.sort;
      }

      return safeFilters;
    } catch {
      return {};
    }
  });

  const { movies, isLoading, hasSearched, hasMore, loadMore } = useMovieResults(
    query,
    filters,
  );

  useEffect(() => {
    if (/^[^<>]*$/.test(query)) {
      sessionStorage.setItem("movieSearchQuery", JSON.stringify(query));
    }
  }, [query]);

  useEffect(() => {
    sessionStorage.setItem("movieSearchFilters", JSON.stringify(filters));
  }, [filters]);

  const handleMovieClick = (movie: Movie) => {
    navigate(`/movie/${movie.id}`);
  };

  const hasActiveFilters =
    filters.genre !== undefined ||
    filters.ratingMin !== undefined ||
    filters.castId !== undefined ||
    (filters.yearFrom !== undefined && filters.yearFrom !== 1900) ||
    (filters.yearTo !== undefined &&
      filters.yearTo !== new Date().getFullYear());

  return (
    <section id="search-page">
      <SearchBar
        onQueryChange={setQuery}
        isLoading={isLoading}
        initialValue={query}
      />
      <RandomButton />
      <button
        type="button"
        className="filter-toggle"
        onClick={() => setShowFilters((v) => !v)}
        aria-expanded={showFilters}
      >
        <span
          className="filter-toggle__icon"
          style={{ transform: showFilters ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
        Filters
        {hasActiveFilters && (
          <span className="filter-toggle__dot" aria-label="Filters active" />
        )}
      </button>

      <div
        className={`filter-panel-wrap ${showFilters ? "filter-panel-wrap--open" : ""}`}
      >
        <FilterPanel
          onFiltersChange={setFilters}
          searchActive={query.length > 0}
        />
      </div>

      <SearchResultsList
        movies={movies}
        isLoading={isLoading}
        hasSearched={hasSearched}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onMovieClick={handleMovieClick}
      />
    </section>
  );
}

export default App;
