import { useMemo, useState } from 'react';
import './App.css';
import Filter from './components/Filter.jsx';
import MovieList from './components/MovieList.jsx';

const initialMovies = [
  {
    title: 'Inception',
    description:
      'A skilled thief enters dreams to steal secrets and gets one last chance to clear his name.',
    posterURL:
      'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    rating: 9,
  },
  {
    title: 'The Last of Us',
    description:
      'A hardened survivor and a teenager cross a changed America after a devastating outbreak.',
    posterURL:
      'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
    rating: 8,
  },
  {
    title: 'Interstellar',
    description:
      'Explorers travel through a wormhole to find humanity a new home beyond Earth.',
    posterURL:
      'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    rating: 9,
  },
];

const emptyMovie = {
  title: '',
  description: '',
  posterURL: '',
  rating: 1,
};

function App() {
  const [movies, setMovies] = useState(initialMovies);
  const [newMovie, setNewMovie] = useState(emptyMovie);
  const [titleFilter, setTitleFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);

  const filteredMovies = useMemo(() => {
    const normalizedTitle = titleFilter.trim().toLowerCase();
    const minimumRating = Number(ratingFilter);

    return movies.filter((movie) => {
      const matchesTitle = movie.title.toLowerCase().includes(normalizedTitle);
      const matchesRating = Number(movie.rating) >= minimumRating;

      return matchesTitle && matchesRating;
    });
  }, [movies, titleFilter, ratingFilter]);

  const handleMovieChange = (event) => {
    const { name, value } = event.target;

    setNewMovie((currentMovie) => ({
      ...currentMovie,
      [name]: name === 'rating' ? Number(value) : value,
    }));
  };

  const handleAddMovie = (event) => {
    event.preventDefault();

    const movieToAdd = {
      ...newMovie,
      title: newMovie.title.trim(),
      description: newMovie.description.trim(),
      posterURL: newMovie.posterURL.trim(),
      rating: Number(newMovie.rating),
    };

    if (!movieToAdd.title || !movieToAdd.description || !movieToAdd.posterURL) {
      return;
    }

    setMovies((currentMovies) => [movieToAdd, ...currentMovies]);
    setNewMovie(emptyMovie);
  };

  return (
    <main className="app-shell">
      <section className="app-header">
        <div>
          <p className="eyebrow">React hooks checkpoint</p>
          <h1>React Moovies</h1>
        </div>
        <div className="movie-count">
          <strong>{filteredMovies.length}</strong>
          <span>shown</span>
        </div>
      </section>

      <section className="controls-grid">
        <form className="movie-form" onSubmit={handleAddMovie}>
          <h2>Add a movie or TV show</h2>
          <div className="form-grid">
            <label>
              Title
              <input
                name="title"
                type="text"
                value={newMovie.title}
                onChange={handleMovieChange}
                placeholder="Movie title"
                required
              />
            </label>

            <label>
              Rating
              <input
                name="rating"
                type="number"
                min="1"
                max="10"
                value={newMovie.rating}
                onChange={handleMovieChange}
                required
              />
            </label>

            <label className="wide-field">
              Poster URL
              <input
                name="posterURL"
                type="url"
                value={newMovie.posterURL}
                onChange={handleMovieChange}
                placeholder="https://example.com/poster.jpg"
                required
              />
            </label>

            <label className="wide-field">
              Description
              <textarea
                name="description"
                value={newMovie.description}
                onChange={handleMovieChange}
                placeholder="Short description"
                rows="4"
                required
              />
            </label>
          </div>

          <button type="submit">Add Movie</button>
        </form>

        <Filter
          titleFilter={titleFilter}
          ratingFilter={ratingFilter}
          onTitleFilterChange={setTitleFilter}
          onRatingFilterChange={setRatingFilter}
        />
      </section>

      <MovieList movies={filteredMovies} />
    </main>
  );
}

export default App;
