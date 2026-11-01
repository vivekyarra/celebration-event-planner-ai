import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuestTracker } from '../components/GuestTracker';
import { createDefaultEventPlan } from '../services/plannerGenerator';

function setup() {
  const onUpdateGuests = vi.fn();
  render(<GuestTracker plan={createDefaultEventPlan()} onUpdateGuests={onUpdateGuests} />);
  fireEvent.click(screen.getByRole('button', { name: /Add Guest/i }));
  const fill = (name: string, email: string) => {
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: name } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: email } });
    fireEvent.submit(screen.getByLabelText('Full Name').closest('form')!);
  };
  return { onUpdateGuests, fill };
}

describe('Add guest validation', () => {
  it('rejects an invalid email with an inline, announced error', () => {
    const { onUpdateGuests, fill } = setup();
    fill('Ananya Rao', 'ananya@');
    const error = document.getElementById('g-email-error');
    expect(error).toHaveTextContent('"ananya@" is not a valid email address');
    expect(error).toHaveAttribute('role', 'alert');
    expect(screen.getByLabelText('Email Address')).toHaveAttribute('aria-invalid', 'true');
    expect(onUpdateGuests).not.toHaveBeenCalled();
  });

  it('rejects a one-character name', () => {
    const { onUpdateGuests, fill } = setup();
    fill('A', '');
    expect(document.getElementById('g-name-error')).toHaveTextContent('between 2 and 80 characters');
    expect(onUpdateGuests).not.toHaveBeenCalled();
  });

  it('accepts a valid guest and trims whitespace', () => {
    const { onUpdateGuests, fill } = setup();
    fill('  Ananya Rao  ', ' ananya@example.com ');
    expect(onUpdateGuests).toHaveBeenCalledTimes(1);
    const added = onUpdateGuests.mock.calls[0][0].at(-1);
    expect(added).toMatchObject({ name: 'Ananya Rao', email: 'ananya@example.com', rsvpStatus: 'pending' });
  });
});
