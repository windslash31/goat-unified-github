// src/stores/modalStore.test.js
import { renderHook, act } from '@testing-library/react';
import { useModalStore } from './modalStore';

describe('useModalStore', () => {
  it('should have a correct initial state', () => {
    const { result } = renderHook(() => useModalStore());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.modal).toBe(null);
    expect(result.current.data).toBe(null);
  });

  it('should update state when openModal is called', () => {
    const { result } = renderHook(() => useModalStore());
    const mockData = { id: 1, name: 'Test Employee' };

    act(() => {
      result.current.openModal('editEmployee', mockData);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.modal).toBe('editEmployee');
    expect(result.current.data).toEqual(mockData);
  });

  it('should reset state when closeModal is called', () => {
    const { result } = renderHook(() => useModalStore());
    const mockData = { id: 1, name: 'Test Employee' };

    // First, open the modal
    act(() => {
      result.current.openModal('editEmployee', mockData);
    });

    // Then, close it
    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.modal).toBe(null);
    expect(result.current.data).toBe(null);
  });
});