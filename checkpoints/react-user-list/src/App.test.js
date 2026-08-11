import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the user directory heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /user directory/i })).toBeInTheDocument();
});
