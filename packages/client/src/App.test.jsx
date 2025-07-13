// src/App.test.jsx
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { useModalStore } from './stores/modalStore';
import App from './App';
import { useAuthStore } from './stores/authStore';
import api from './api/api';

// --- MODIFICATION START ---
// Mock child components and api module
vi.mock('./pages/LoginPage', () => ({ LoginPage: () => <div>Login Page</div> }));
vi.mock('./pages/DashboardPage', () => ({ DashboardPage: () => <div>Dashboard Page</div> }));
vi.mock('./api/api'); // Mock the entire api module

vi.mock('./stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));
// --- MODIFICATION END ---

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderApp = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('App component modal integration', () => {
  beforeEach(() => {
    act(() => {
      useModalStore.getState().closeModal();
    });
    
    useAuthStore.mockImplementation(() => ({
      isAuthenticated: true,
      user: { name: 'Test User', email: 'test@example.com', permissions: ['dashboard:view'] },
      fetchUser: vi.fn(),
      logout: vi.fn(),
    }));

    // --- MODIFICATION START ---
    // Provide a default mock implementation for all api calls
    api.get.mockImplementation((url) => {
        if (url.includes('/api/auth/me')) {
            return Promise.resolve({ data: { id: 1, name: 'Test Employee' } });
        }
        return Promise.resolve({ data: [] }); // Default empty array for other GET requests
    });
    // --- MODIFICATION END ---
  });

  it('should not render any modal initially', () => {
    renderApp();
    expect(screen.queryByText(/Edit .* Profile/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Manual Platform Suspension/i)).not.toBeInTheDocument();
  });

  it('should render the EditEmployeeModal when the store state changes', async () => {
    renderApp();
    const employeeToEdit = { id: 1, first_name: 'John' };
    
    act(() => {
      useModalStore.getState().openModal('editEmployee', employeeToEdit);
    });

    const modalTitle = await screen.findByText(/Edit John's Profile/i);
    expect(modalTitle).toBeInTheDocument();
  });

  it('should render the DeactivateEmployeeModal when the store state changes', async () => {
    renderApp();
    const employeeToDeactivate = { id: 2, first_name: 'Jane', last_name: 'Doe' };
    
    act(() => {
      useModalStore.getState().openModal('deactivateEmployee', employeeToDeactivate);
    });
    
    const modalTitle = await screen.findByText(/Manual Platform Suspension/i);
    expect(modalTitle).toBeInTheDocument();
  });
});