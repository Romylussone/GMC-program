import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FIFA Player Cards heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/fifa player cards/i);
  expect(headingElement).toBeInTheDocument();
});
