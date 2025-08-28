import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';

// Mock the auth context
const mockAuthContext = {
  user: null,
  profile: null,
  loading: false,
  logout: vi.fn()
};

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuthContext
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const MockWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders SardAI logo and brand', () => {
    render(
      <MockWrapper>
        <Navigation />
      </MockWrapper>
    );
    
    expect(screen.getByText('SardAI')).toBeInTheDocument();
  });

  it('shows login/register buttons when not authenticated', () => {
    render(
      <MockWrapper>
        <Navigation />
      </MockWrapper>
    );
    
    expect(screen.getByRole('button', { name: /accedi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrati/i })).toBeInTheDocument();
  });

  it('shows user menu when authenticated', () => {
    mockAuthContext.user = { id: '1', email: 'test@example.com' };
    mockAuthContext.profile = { full_name: 'Test User', is_premium: false };
    
    render(
      <MockWrapper>
        <Navigation />
      </MockWrapper>
    );
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('has proper mobile menu accessibility', async () => {
    render(
      <MockWrapper>
        <Navigation />
      </MockWrapper>
    );
    
    const mobileMenuButton = screen.getByRole('button', { name: /menu mobile/i });
    expect(mobileMenuButton).toHaveAttribute('aria-expanded');
    
    fireEvent.click(mobileMenuButton);
    
    // Check that mobile menu becomes visible
    expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('provides proper navigation landmarks', () => {
    render(
      <MockWrapper>
        <Navigation />
      </MockWrapper>
    );
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});