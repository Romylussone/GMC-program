function MovieCard({ movie }) {
  return (
    <article className="movie-card">
      <img src={movie.posterURL} alt={`${movie.title} poster`} />
      <div className="movie-card-content">
        <div className="movie-card-heading">
          <h3>{movie.title}</h3>
          <span>{movie.rating}/10</span>
        </div>
        <p>{movie.description}</p>
      </div>
    </article>
  );
}

export default MovieCard;
