import { afterEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSessionStore } from '@/stores/sessionStore';
import { renderApp } from './renderApp';

afterEach(() => useSessionStore.getState().reset());

describe('routing and authentication', () => {
  it('sends anonymous visitors to the sign-in page (protected route)', async () => {
    const { router } = renderApp('/interviews', { signedIn: false });
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.state).toEqual({ from: '/interviews' }); // remembered, so login can return there
  });

  it('validates with Zod before any request is sent', async () => {
    const user = userEvent.setup();
    const { fake } = renderApp('/login', { signedIn: false });
    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter your email.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(fake.calls).not.toContain('POST /auth/login');
  });

  it('shows the server message for wrong credentials', async () => {
    const user = userEvent.setup();
    renderApp('/login', { signedIn: false });
    await user.type(await screen.findByLabelText('Email'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-pass1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
  });

  it('signs in and lands on the dashboard with stats derived from the feedback list', async () => {
    const user = userEvent.setup();
    renderApp('/login', { signedIn: false });
    await user.type(await screen.findByLabelText('Email'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), 'Passw0rd1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Hello, Asha' })).toBeInTheDocument();
    const sessions = (await screen.findByText('Sessions scored')).parentElement;
    expect(within(sessions).getByText('2')).toBeInTheDocument();
    expect(screen.getByText('6.5')).toBeInTheDocument(); // mean of 7.4 and 5.6
    expect(screen.getByText('Next session')).toBeInTheDocument();
  });
});

describe('feedback scorecard', () => {
  it('renders the verdict, every rubric row and the per-question breakdown', async () => {
    renderApp('/interviews/i1/feedback');
    expect(await screen.findByRole('heading', { name: 'Strong showing' })).toBeInTheDocument();
    for (const label of ['Technical accuracy', 'Depth', 'Problem solving', 'Communication', 'Structure']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText('Explain what happens after setState.')).toBeInTheDocument();
    expect(screen.getByText('No answer was submitted.')).toBeInTheDocument(); // blank answers are called out
  });
});

describe('booking', () => {
  it('shows taken slots as disabled and mirrors a picked slot in the summary', async () => {
    const user = userEvent.setup();
    renderApp('/book');
    const grid = await screen.findByRole('group', { name: 'Available times' });
    const buttons = within(grid).getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[1]).toBeDisabled(); // taken

    await user.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    const summary = screen.getByRole('complementary', { name: 'Booking summary' });
    expect(within(summary).getByText(/10:00 am IST/)).toBeInTheDocument();
    expect(within(summary).getByRole('button', { name: 'Book this slot' })).toBeDisabled(); // no category yet
  });
});

describe('resumes', () => {
  it('rejects a non-PDF file in the browser, before any upload', async () => {
    // The input's accept attribute filters the file picker, but drag-and-drop bypasses it, so validate in code too.
    const user = userEvent.setup({ applyAccept: false });
    const { fake } = renderApp('/resumes');
    await screen.findByRole('heading', { name: 'Your resumes' });
    await user.upload(document.querySelector('#resume-file'), new File(['hello'], 'notes.txt', { type: 'text/plain' }));
    expect(await screen.findByText('Only PDF files are supported.')).toBeInTheDocument();
    expect(fake.calls).not.toContain('POST /resumes');
  });

  it('lists existing resumes', async () => {
    renderApp('/resumes', { resumes: [{ id: 'r1', fileName: 'asha-cv.pdf', sizeBytes: 120_000, createdAt: '2026-10-20T00:00:00.000Z' }] });
    expect(await screen.findByText('asha-cv.pdf')).toBeInTheDocument();
  });
});

describe('live session', () => {
  it('seeds the Zustand store, keeps a controlled textarea in sync and tracks unsaved changes', async () => {
    const user = userEvent.setup();
    renderApp('/interviews/i2/session');
    expect(await screen.findByRole('heading', { name: 'Walk me through what happens after setState.' })).toBeInTheDocument();
    expect(screen.getByRole('timer')).toBeInTheDocument();

    const box = screen.getByRole('textbox', { name: 'Answer to question 1' });
    await user.type(box, 'React batches the update');
    expect(box).toHaveValue('React batches the update');
    expect(screen.getByText(/4 words/)).toBeInTheDocument();
    expect(useSessionStore.getState().answers[0]).toBe('React batches the update');
    expect(useSessionStore.getState().dirty).toBe(true);

    await user.click(screen.getByRole('button', { name: /Next question/ }));
    expect(await screen.findByRole('heading', { name: 'How would you speed up a slow list?' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Answer to question 2' })).toHaveValue(''));
  });
});
