function MovieCard({ movie, onMovieSelect }) {
  return (
    <article className="movie-card">
      <button
        className="movie-card-link"
        type="button"
        onClick={() => onMovieSelect(movie.id)}
        aria-label={`View details for ${movie.title}`}
      >
      <img src={movie.posterURL} alt={`${movie.title} poster`} />
      <div className="movie-card-content">
        <div className="movie-card-heading">
          <h3>{movie.title}</h3>
          <span>{movie.rating}/10</span>
        </div>
        <p>{movie.description}</p>
      </div>
      </button>
    </article>
  );
}

export default MovieCard;
