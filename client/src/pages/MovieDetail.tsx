import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./MovieDetail.css";

import MovieRecommendations from "../components/MovieRecommendations";
import MovieGraph from "../components/MovieGraph";
import ReviewsList from "../components/ReviewsList";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const CAST_IMAGE_BASE = "https://image.tmdb.org/t/p/w200";
const PLACEHOLDER_POSTER = "https://via.placeholder.com/300x450?text=No+Poster";
const PLACEHOLDER_AVATAR = "https://via.placeholder.com/80x120?text=No+Image";
const MAX_CAST_TO_SHOW = 5;

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface MovieDetail {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  genres: { id: number; name: string }[];
  credits: { cast: CastMember[] };
}

function CastList({ cast }: Readonly<{ cast: CastMember[] }>) {
  const topCast = cast.slice(0, MAX_CAST_TO_SHOW);

  if (topCast.length === 0) {
    return <p>No cast information available.</p>;
  }

  return (
    <div className="cast-list">
      {topCast.map((actor) => {
        let avatarUrl = PLACEHOLDER_AVATAR;

        if (actor.profile_path) {
          avatarUrl = `${CAST_IMAGE_BASE}${actor.profile_path}`;
        }

        return (
          <div key={actor.id} className="cast-card">
            <img src={avatarUrl} alt={actor.name} className="cast-image" />
            <p className="cast-name">{actor.name}</p>
            <p className="cast-character">{actor.character}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchMovie = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Movie not found");
        }

        const data: MovieDetail = await response.json();
        setMovie(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  //loading section
  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="loading-ring" />
          </div>
          <p className="loading-text">
            Loading movie details <span className="loading-dots" />
          </p>
        </div>
      </div>
    );
  }

  //Error page section
  if (error || !movie) {
    return (
      <div className="page-container">
        <div className="error-container">
          <span className="error-icon">🎥</span>

          <h1 className="error-title">
            {error === "Movie not found" ? "404" : "Oops!"}
          </h1>

          <p className="error-message">{error || "Movie not found"}</p>

          <p className="error-hint">
            The film you're looking for might have been moved, deleted,
            <br />
            or never existed 💀
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="error-back-button"
          >
            <span className="arrow">←</span> Back to Search
          </button>
        </div>
      </div>
    );
  }

  // Format the runtime
  let formattedRuntime = "Unknown";
  if (movie.runtime) {
    formattedRuntime = `${movie.runtime} min`;
  }

  // Format the release date
  let formattedReleaseDate = "Unknown";
  let releaseYear: number | null = null;
  if (movie.release_date) {
    formattedReleaseDate = movie.release_date;
    releaseYear = Number(movie.release_date.slice(0, 4));
  }

  // Format the genres
  let genreNames = "N/A";
  if (movie.genres && movie.genres.length > 0) {
    genreNames = movie.genres.map((g) => g.name).join(", ");
  }

  let posterUrl = PLACEHOLDER_POSTER;
  if (movie.poster_path) {
    posterUrl = `${IMAGE_BASE_URL}${movie.poster_path}`;
  }

  let voteAverageDisplay = "N/A";
  if (movie.vote_average) {
    voteAverageDisplay = `${movie.vote_average.toFixed(1)} / 10`;
  }

  let castData: CastMember[] = [];
  if (movie.credits?.cast) {
    castData = movie.credits.cast;
  }

  //Movie page section
  return (
    <div className="page-container">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="back-button"
      >
        ← Back to Search
      </button>

      <div className="movie-layout">
        <img src={posterUrl} alt={movie.title} className="movie-poster" />

        <div className="movie-info">
          <h1 className="movie-title">{movie.title}</h1>
          <p>
            <strong>Rating:</strong> {voteAverageDisplay}
          </p>
          <p>
            <strong>Release:</strong> {formattedReleaseDate}
          </p>
          <p>
            <strong>Runtime:</strong> {formattedRuntime}
          </p>
          <p>
            <strong>Genres:</strong> {genreNames}
          </p>

          <h3>Overview</h3>
          <p>{movie.overview || "No overview available."}</p>

          <h3>Cast</h3>
          <CastList cast={castData} />
        </div>
      </div>
      <h3>Recommendations</h3>
      <MovieRecommendations movieId={movie.id} />

      <h3>Related Movies Graph</h3>
      <MovieGraph movieId={movie.id} title={movie.title} year={releaseYear} />

      <h3>Review from User</h3>
      <ReviewsList movieId={movie.id} />
    </div>
  );
}
