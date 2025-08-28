import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock;

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial value when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('initial');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('returns stored value when localStorage has data', () => {
    const storedValue = { name: 'Test User' };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedValue));
    
    const { result } = renderHook(() => useLocalStorage('test-key', {}));
    
    expect(result.current[0]).toEqual(storedValue);
  });

  it('saves value to localStorage when setValue is called', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useLocalStorage('test-key', ''));
    
    act(() => {
      result.current[1]('new value');
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"new value"');
    expect(result.current[0]).toBe('new value');
  });

  it('handles localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });
    
    // Should not throw and should return initial value
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    
    expect(result.current[0]).toBe('fallback');
  });

  it('removes item when value is undefined', () => {
    localStorageMock.getItem.mockReturnValue('"existing value"');
    
    const { result } = renderHook(() => useLocalStorage('test-key', ''));
    
    act(() => {
      result.current[1](undefined);
    });
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
  });
});