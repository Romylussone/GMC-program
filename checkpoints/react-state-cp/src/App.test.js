import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

test("toggles the person profile", () => {
  render(<App />);

  expect(screen.queryByText(/Amina Carter/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /show profile/i }));

  expect(screen.getByText(/Amina Carter/i)).toBeInTheDocument();
  expect(screen.getByText(/React Developer/i)).toBeInTheDocument();
  expect(
    screen.getByText(/front-end developer focused on building practical/i)
  ).toBeInTheDocument();
});
