import { useCallback, useEffect, useRef } from "react";
import type { Movie } from "../types/movie";
import "./SearchResultsList.css";

interface SearchResultsListProps {
  movies: Movie[];
  isLoading: boolean;
  hasSearched: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onMovieClick: (movie: Movie) => void;
}

const FALLBACK_POSTER = "/placeholder-poster.png";

export default function SearchResultsList({
  movies,
  isLoading,
  hasSearched,
  hasMore,
  onLoadMore,
  onMovieClick,
}: Readonly<SearchResultsListProps>) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore],
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [handleIntersect]);

  if (hasSearched && !isLoading && movies.length === 0) {
    return (
      <div
        className="search-results search-results--empty"
        role="status"
        aria-live="polite"
      >
        <p>No movies found. Try a different title.</p>
      </div>
    );
  }

  if (!hasSearched && movies.length === 0) {
    return null;
  }

  return (
    <section className="search-results" aria-label="Search results">
      <p className="visually-hidden" role="status" aria-live="polite">
        {`${movies.length} result${movies.length === 1 ? "" : "s"} found`}
      </p>

      <ul className="search-results__grid">
        {movies.map((movie) => (
          <li key={movie.id} className="search-results__item">
            <button
              type="button"
              className="search-results__card"
              onClick={() => onMovieClick(movie)}
              aria-label={`View details for ${movie.title}`}
            >
              <img
                src={movie.posterUrl ?? FALLBACK_POSTER}
                alt=""
                className="search-results__poster"
                loading="lazy"
              />
              <div className="search-results__meta">
                <span className="search-results__title">{movie.title}</span>
                <span className="search-results__year">
                  {movie.year ?? "Unknown year"}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {isLoading && (
        <div
          className="search-results__loading"
          role="status"
          aria-live="polite"
        >
          Loading more results...
        </div>
      )}

      {hasMore && (
        <div
          ref={sentinelRef}
          className="search-results__sentinel"
          aria-hidden="true"
        />
      )}
    </section>
  );
}
