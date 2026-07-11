import MovieCard from './MovieCard.jsx';

function MovieList({ movies }) {
  if (movies.length === 0) {
    return <p className="empty-state">No movies match the current filters.</p>;
  }

  return (
    <section className="movie-list" aria-label="Movie list">
      {movies.map((movie) => (
        <MovieCard key={`${movie.title}-${movie.posterURL}`} movie={movie} />
      ))}
    </section>
  );
}

export default MovieList;
