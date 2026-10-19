import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

const task = { _id: 'abc', title: 'Read the Azure guide', completed: false };
const response = (data, ok = true) => ({ ok, status: ok ? 200 : 503, json: async () => data });

describe('task board', () => {
  it('adds a task, edits it, and updates completion and filters', async () => {
    const user = userEvent.setup();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response(task))
      .mockResolvedValueOnce(response({ ...task, title: 'Deploy the app' }))
      .mockResolvedValueOnce(response({ ...task, title: 'Deploy the app', completed: true }));
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    await screen.findByText('A fresh start awaits');
    await user.type(screen.getByRole('textbox', { name: 'New task' }), task.title);
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    expect(await screen.findByText(task.title)).toBeInTheDocument();
    expect(fetch.mock.calls[1][1].body).toBe(JSON.stringify({ title: task.title }));

    await user.click(screen.getByRole('button', { name: `Edit ${task.title}` }));
    const edit = screen.getByRole('textbox', { name: 'Edit task title' });
    await user.clear(edit);
    await user.type(edit, 'Deploy the app');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Deploy the app');
    await user.click(screen.getByRole('checkbox', { name: 'Mark Deploy the app complete' }));
    expect(
      await screen.findByRole('checkbox', { name: 'Mark Deploy the app active' }),
    ).toBeChecked();
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '100');
    await user.click(screen.getByRole('button', { name: 'Active', exact: true }));
    expect(screen.getByText('All caught up. Nicely done!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Completed', exact: true }));
    expect(screen.getByText('Deploy the app')).toBeInTheDocument();
  });

  it('keeps a task visible when deletion fails and allows retrying', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response([task]))
        .mockResolvedValueOnce(response({ message: 'Database temporarily unavailable.' }, false))
        .mockResolvedValueOnce({ ok: true, status: 204 }),
    );
    render(<App />);
    await screen.findByText(task.title);
    await user.click(screen.getByRole('button', { name: `Delete ${task.title}` }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Database temporarily unavailable.');
    expect(screen.getByText(task.title)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: `Delete ${task.title}` }));
    await waitFor(() => expect(screen.queryByText(task.title)).not.toBeInTheDocument());
  });

  it('shows a connection error and reloads the list on retry', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('offline'))
        .mockResolvedValueOnce(response([task])),
    );
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server');
    expect(screen.getByRole('textbox', { name: 'New task' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(task.title)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'New task' })).toBeEnabled();
  });

  it('clears completed tasks while keeping active ones', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          response([task, { _id: 'done', title: 'Finished task', completed: true }]),
        )
        .mockResolvedValueOnce(response({ deletedCount: 1 })),
    );
    render(<App />);
    await screen.findByText('Finished task');
    await user.click(screen.getByRole('button', { name: 'Clear completed (1)' }));
    await waitFor(() => expect(screen.queryByText('Finished task')).not.toBeInTheDocument());
    expect(screen.getByText(task.title)).toBeInTheDocument();
  });
});
