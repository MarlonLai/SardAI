import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import LandingPage from '@/pages/LandingPage';

// Mock the hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false
  })
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const MockProviders = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main heading', () => {
    render(
      <MockProviders>
        <LandingPage />
      </MockProviders>
    );
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/L'assistente che parla/i)).toBeInTheDocument();
  });

  it('renders the main CTA button', () => {
    render(
      <MockProviders>
        <LandingPage />
      </MockProviders>
    );
    
    const ctaButton = screen.getByRole('button', { name: /inizia a chiacchierare/i });
    expect(ctaButton).toBeInTheDocument();
  });

  it('displays features section', () => {
    render(
      <MockProviders>
        <LandingPage />
      </MockProviders>
    );
    
    expect(screen.getByText(/cosa rende sardai speciale/i)).toBeInTheDocument();
    expect(screen.getByText(/risposte in streaming/i)).toBeInTheDocument();
    expect(screen.getByText(/memoria intelligente/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <MockProviders>
        <LandingPage />
      </MockProviders>
    );
    
    // Check for proper heading hierarchy
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/L'assistente che parla/);
    
    // Check for navigation landmarks
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('features have proper structure', () => {
    render(
      <MockProviders>
        <LandingPage />
      </MockProviders>
    );
    
    // Each feature should have a heading and description
    const featureHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(featureHeadings.length).toBeGreaterThan(0);
    
    // Check that CTA buttons are accessible
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type');
    });
  });
});