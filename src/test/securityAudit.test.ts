import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  sanitizeHtml,
  sanitizeUrl,
  isSafeUrl,
  isValidHexColor,
  calculateRelativeLuminance,
  calculateContrastRatio,
  isWcagCompliant,
  exportPlanToJson,
  getAccessibleName,
  ClientRateLimiter,
} from '../services/security';
import { validateEventPlan } from '../utils/schemaValidator';
import { createDefaultEventPlan } from '../services/plannerGenerator';
import { SpeechStudio } from '../components/SpeechStudio';
import { ThemeStudio } from '../components/ThemeStudio';
import { CateringMenu } from '../components/CateringMenu';
import { EventHeader } from '../components/EventHeader';

describe('Security & WCAG 2.1 AAA Audit Test Suite', () => {
  // Test 1: Polymorphic XSS attacks and dangerous vectors
  it('1. sanitizes polymorphic XSS attacks, SVG vectors, and dangerous URI schemes', () => {
    // Attack vector 1: SVG onload injection
    const svgVector = '<svg onload="alert(document.domain)">Test</svg>';
    const sanitizedSvg = sanitizeHtml(svgVector);
    expect(sanitizedSvg).not.toContain('<svg');
    expect(sanitizedSvg).toContain('&lt;svg');
    expect(sanitizedSvg).toContain('&gt;');

    // Attack vector 2: JavaScript URI protocol
    const jsProtocol = 'javascript:alert(window.origin)';
    expect(sanitizeUrl(jsProtocol)).toBe('about:blank');
    expect(isSafeUrl(jsProtocol)).toBe(false);

    // Attack vector 3: VBScript and Data HTML URI protocol
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('about:blank');
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    expect(sanitizeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe('about:blank');
    expect(isSafeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false);

    // Safe URLs should be preserved
    expect(isSafeUrl('https://celebrite.ai/dashboard')).toBe(true);
    expect(sanitizeUrl('https://celebrite.ai/dashboard')).toBe('https://celebrite.ai/dashboard');
    expect(isSafeUrl('mailto:concierge@celebrite.ai')).toBe(true);

    // Attack vector 4: Attribute breakout with nested quotes
    const breakoutVector = '"><script>alert(1)</script><input value="';
    const sanitizedBreakout = sanitizeHtml(breakoutVector);
    expect(sanitizedBreakout).not.toContain('<script>');
    expect(sanitizedBreakout).toContain('&quot;&gt;&lt;script&gt;');
  });

  // Test 2: Speech Studio input length bounds and speech output sanitization
  it('2. validates length bounds (min 3, max 500 chars) and sanitizes speech text output', () => {
    const plan = createDefaultEventPlan();
    render(React.createElement(SpeechStudio, { plan }));

    const promptInput = screen.getByLabelText(/Custom Key Message \/ Theme Focus/i);
    expect(promptInput).toBeInTheDocument();

    // Input under 3 characters should trigger accessible error
    fireEvent.change(promptInput, { target: { value: 'Hi' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 3 characters/i);
    expect(promptInput).toHaveAttribute('aria-invalid', 'true');

    // Valid input length (3 to 500 characters) should pass without error
    fireEvent.change(promptInput, { target: { value: 'Celebrate groundbreaking innovation and team courage' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(promptInput).toHaveAttribute('aria-invalid', 'false');

    // Input with raw HTML injection should be sanitized in rendered script
    fireEvent.change(promptInput, { target: { value: '<script>alert("hack")</script>' } });
    const teleprompterRegion = screen.getByRole('region', { name: /Speech rehearsal script text/i });
    expect(teleprompterRegion.innerHTML).not.toContain('<script>');
    expect(teleprompterRegion.textContent).toContain('alert');
  });

  // Test 3: JSON Export security - verifies masking of sensitive API keys and stripping of prototype pollution
  it('3. verifies JSON export masks sensitive API keys and redacts prototype pollution', () => {
    const plan = createDefaultEventPlan();
    const planWithSecrets = {
      ...plan,
      apiKey: 'AIzaSyDk838xkl193817SecureMockKey999',
      customSecret: 'TopSecretToken12345678',
      __proto__: { backdoor: true },
    };

    const exportedJson = exportPlanToJson(planWithSecrets);
    expect(exportedJson).not.toContain('AIzaSyDk838xkl193817SecureMockKey999');
    expect(exportedJson).toContain('AIza...y999');
    expect(exportedJson).not.toContain('TopSecretToken12345678');
    expect(exportedJson).toContain('TopS...5678');
    expect(exportedJson).not.toContain('"backdoor"');
  });

  // Test 4: JSON Import security - rejects prototype pollution gadgets and malformed payloads
  it('4. verifies JSON import rejects prototype pollution gadgets and untrusted payloads', () => {
    const pollutedJson1 = '{"id":"plan-1","title":"Gala","eventType":"corporate","guestCount":50,"totalBudget":10000,"__proto__":{"isAdmin":true}}';
    const result1 = validateEventPlan(pollutedJson1);
    expect(result1.isValid).toBe(false);
    expect(result1.errors.some((e) => e.toLowerCase().includes('prototype pollution'))).toBe(true);

    const pollutedJson2 = '{"id":"plan-2","title":"Gala","eventType":"corporate","guestCount":50,"totalBudget":10000,"constructor":{"prototype":{"injected":true}}}';
    const result2 = validateEventPlan(pollutedJson2);
    expect(result2.isValid).toBe(false);
    expect(result2.errors.some((e) => e.toLowerCase().includes('prototype pollution'))).toBe(true);

    // Clean JSON import succeeds
    const validPlan = createDefaultEventPlan();
    const cleanJson = JSON.stringify(validPlan);
    const resultValid = validateEventPlan(cleanJson);
    expect(resultValid.isValid).toBe(true);
    expect(resultValid.sanitizedPlan).toBeDefined();
  });

  // Test 5: Client-side rate limiting under burst traffic simulation
  it('5. enforces token-bucket rate limiting under burst traffic simulation', () => {
    const burstLimit = 10;
    const limiter = new ClientRateLimiter({
      maxTokens: burstLimit,
      refillRate: burstLimit,
      refillIntervalMs: 60000,
    });

    let allowedCount = 0;
    let blockedCount = 0;

    // Simulate burst traffic of 50 consecutive queries
    for (let i = 0; i < 50; i++) {
      if (limiter.tryConsume(1)) {
        allowedCount++;
      } else {
        blockedCount++;
      }
    }

    expect(allowedCount).toBe(burstLimit);
    expect(blockedCount).toBe(40);
    expect(limiter.getRemainingTokens()).toBe(0);
    expect(limiter.tryConsume(1)).toBe(false);

    // Negative and zero tokens requested should safely fail
    expect(limiter.tryConsume(-1)).toBe(false);
    expect(limiter.tryConsume(0)).toBe(false);

    // Reset restores full burst capacity
    limiter.reset();
    expect(limiter.getRemainingTokens()).toBe(burstLimit);
    expect(limiter.tryConsume(1)).toBe(true);
  });

  // Test 6: Strict hex color validation regex /^#[0-9a-fA-F]{6}$/
  it('6. validates hex color format against strict regex /^#[0-9a-fA-F]{6}$/', () => {
    // Valid 6-character hex colors
    expect(isValidHexColor('#ffffff')).toBe(true);
    expect(isValidHexColor('#000000')).toBe(true);
    expect(isValidHexColor('#4f46e5')).toBe(true);
    expect(isValidHexColor('#ABCDEF')).toBe(true);
    expect(isValidHexColor('#123456')).toBe(true);

    // Invalid hex colors
    expect(isValidHexColor('#fff')).toBe(false); // 3-character hex
    expect(isValidHexColor('4f46e5')).toBe(false); // Missing leading hash
    expect(isValidHexColor('#4f46e5aa')).toBe(false); // 8-character hex (with alpha)
    expect(isValidHexColor('#gggggg')).toBe(false); // Non-hex characters
    expect(isValidHexColor('#12345')).toBe(false); // 5 characters
    expect(isValidHexColor('')).toBe(false); // Empty
    expect(isValidHexColor(null)).toBe(false);
    expect(isValidHexColor(undefined)).toBe(false);
  });

  // Test 7: WCAG 2.1 relative luminance and contrast ratio calculations (AA and AAA)
  it('7. calculates relative luminance and verifies WCAG 2.1 AAA (7.0:1) and AA (4.5:1) compliance', () => {
    // Relative Luminance: pure black = 0, pure white = 1
    const whiteLum = calculateRelativeLuminance('#ffffff');
    const blackLum = calculateRelativeLuminance('#000000');
    expect(whiteLum).toBeCloseTo(1.0, 4);
    expect(blackLum).toBeCloseTo(0.0, 4);

    // Contrast ratio: black on white = 21.0:1
    const maxContrast = calculateContrastRatio('#ffffff', '#000000');
    expect(maxContrast).toBe(21.0);

    // Contrast ratio: identical colors = 1.0:1
    const minContrast = calculateContrastRatio('#ffffff', '#ffffff');
    expect(minContrast).toBe(1.0);

    // WCAG AAA verification (>= 7.0:1)
    expect(isWcagCompliant('#ffffff', '#000000', 'AAA')).toBe(true);
    expect(isWcagCompliant('#ffffff', '#000000', 'AA')).toBe(true);

    // Low contrast should fail AA and AAA
    const lowContrastRatio = calculateContrastRatio('#777777', '#888888');
    expect(lowContrastRatio).toBeLessThan(2.0);
    expect(isWcagCompliant('#777777', '#888888', 'AA')).toBe(false);
    expect(isWcagCompliant('#777777', '#888888', 'AAA')).toBe(false);
  });

  // Test 8: Accessible name computation on buttons and interactive controls
  it('8. computes accessible names on buttons, swatch controls, and form elements', () => {
    // 1. Element with aria-label
    const btnWithLabel = document.createElement('button');
    btnWithLabel.setAttribute('aria-label', 'Select Primary Color #4f46e5');
    expect(getAccessibleName(btnWithLabel)).toBe('Select Primary Color #4f46e5');

    // 2. Element with text content
    const btnWithText = document.createElement('button');
    btnWithText.textContent = 'Copy Invitation Script';
    expect(getAccessibleName(btnWithText)).toBe('Copy Invitation Script');

    // 3. Element with aria-labelledby
    const labelContainer = document.createElement('div');
    const labelEl = document.createElement('span');
    labelEl.id = 'target-title';
    labelEl.textContent = 'Speech Teleprompter';
    const targetEl = document.createElement('section');
    targetEl.setAttribute('aria-labelledby', 'target-title');
    labelContainer.appendChild(labelEl);
    labelContainer.appendChild(targetEl);
    document.body.appendChild(labelContainer);

    expect(getAccessibleName(targetEl)).toBe('Speech Teleprompter');
    document.body.removeChild(labelContainer);
  });

  // Test 9: Component accessibility audit in SpeechStudio
  it('9. verifies SpeechStudio speed slider, tone select, persona select, and play/pause controls have ARIA attributes', () => {
    const plan = createDefaultEventPlan();
    render(React.createElement(SpeechStudio, { plan }));

    // Speed slider checks
    const speedSlider = screen.getByLabelText(/Speech playback speed slider/i);
    expect(speedSlider).toBeInTheDocument();
    expect(speedSlider).toHaveAttribute('type', 'range');
    expect(speedSlider).toHaveAttribute('aria-valuemin', '0.5');
    expect(speedSlider).toHaveAttribute('aria-valuemax', '2');
    expect(speedSlider).toHaveAttribute('aria-valuenow', '1');

    // Persona select checks
    const personaSelect = screen.getByLabelText(/Speaker persona select/i);
    expect(personaSelect).toBeInTheDocument();

    // Tone select checks
    const toneSelect = screen.getByLabelText(/Tone of voice select/i);
    expect(toneSelect).toBeInTheDocument();

    // Target duration select
    const durationSelect = screen.getByLabelText(/Target duration select/i);
    expect(durationSelect).toBeInTheDocument();
  });

  // Test 10: Component accessibility audit in ThemeStudio
  it('10. verifies ThemeStudio color swatches have clear accessible names and validates custom hex input', () => {
    const plan = createDefaultEventPlan();
    render(React.createElement(ThemeStudio, { plan }));

    // Color swatch buttons have explicit accessible names matching Select ... Color #...
    const swatchButtons = screen.getAllByRole('button', { name: /^Select .* Color #[0-9a-fA-F]{6}$/i });
    expect(swatchButtons.length).toBeGreaterThanOrEqual(3);

    // Custom Hex input validation
    const hexInput = screen.getByLabelText(/Custom Hex Color/i);
    expect(hexInput).toBeInTheDocument();

    // Invalid hex entered
    fireEvent.change(hexInput, { target: { value: 'invalid-hex' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/must match regex/i);
    expect(hexInput).toHaveAttribute('aria-invalid', 'true');

    // Valid hex entered
    fireEvent.change(hexInput, { target: { value: '#10b981' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(hexInput).toHaveAttribute('aria-invalid', 'false');
  });

  // Test 11: Component accessibility audit in CateringMenu
  it('11. verifies CateringMenu dietary filter chips have role="button", aria-pressed, and validates cost bounds', () => {
    const plan = createDefaultEventPlan();
    render(React.createElement(CateringMenu, { plan, onUpdateMenu: vi.fn() }));

    // Dietary filter chips checks
    const filterRegion = screen.getByRole('region', { name: /Dietary preference filters/i });
    expect(filterRegion).toBeInTheDocument();

    const allChip = screen.getByRole('button', { name: /Filter menu by dietary preference: All/i });
    expect(allChip).toBeInTheDocument();
    expect(allChip).toHaveAttribute('aria-pressed', 'true');

    const veganChip = screen.getByRole('button', { name: /Filter menu by dietary preference: Vegan/i });
    expect(veganChip).toBeInTheDocument();
    expect(veganChip).toHaveAttribute('aria-pressed', 'false');

    // Clicking vegan filter toggles aria-pressed
    fireEvent.click(veganChip);
    expect(veganChip).toHaveAttribute('aria-pressed', 'true');
    expect(allChip).toHaveAttribute('aria-pressed', 'false');

    // Add Custom Dish modal cost bounds validation
    const addBtn = screen.getByRole('button', { name: /Add custom dish to catering menu/i });
    fireEvent.click(addBtn);

    const costInput = screen.getByLabelText(/Estimated Cost per Serving/i);
    expect(costInput).toBeInTheDocument();

    // Negative cost rejected
    fireEvent.change(costInput, { target: { value: '-20' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/must be at least 0/i);
    expect(costInput).toHaveAttribute('aria-invalid', 'true');

    // Out-of-bounds excessive cost rejected
    fireEvent.change(costInput, { target: { value: '99999' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot exceed 5,000/i);
    expect(costInput).toHaveAttribute('aria-invalid', 'true');
  });

  // Test 12: Component accessibility audit in EventHeader
  it('12. verifies EventHeader KPI metric cards have role="group" and explicit aria-labels', () => {
    const plan = createDefaultEventPlan();
    render(React.createElement(EventHeader, { plan }));

    // KPI grid region
    const kpiRegion = screen.getByRole('region', { name: /Key Performance Indicators/i });
    expect(kpiRegion).toBeInTheDocument();

    // KPI metric cards
    const totalBudgetCard = screen.getByRole('group', { name: new RegExp(`Total Budget: ${plan.currency}`, 'i') });
    expect(totalBudgetCard).toBeInTheDocument();

    const targetGuestsCard = screen.getByRole('group', { name: new RegExp(`Target Guests: ${plan.guestCount}`, 'i') });
    expect(targetGuestsCard).toBeInTheDocument();

    const rsvpCard = screen.getByRole('group', { name: /Confirmed RSVPs:/i });
    expect(rsvpCard).toBeInTheDocument();

    const unitEconomicsCard = screen.getByRole('group', { name: /Unit Economics:/i });
    expect(unitEconomicsCard).toBeInTheDocument();

    const timelineRunCard = screen.getByRole('group', { name: /Timeline Progress:/i });
    expect(timelineRunCard).toBeInTheDocument();
  });
});