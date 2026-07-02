import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the featured product name', () => {
  render(<App />);
  const productName = screen.getByText(/aurora brew kit/i);
  expect(productName).toBeInTheDocument();
});
