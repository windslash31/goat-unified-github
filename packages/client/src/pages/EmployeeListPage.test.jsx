import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmployeeListPage } from './EmployeeListPage';

// Mock the hooks used by the component
vi.mock('../hooks/useEmployeeTable', () => ({
  useEmployeeTable: vi.fn(),
}));

vi.mock('../hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(),
}));

vi.mock('../hooks/useFetchFilterOptions', () => ({
    useFetchFilterOptions: vi.fn(() => []),
}));

// Mock child components
vi.mock('../components/employees/DesktopTable', () => ({
  DesktopTable: () => <div data-testid="desktop-table">Desktop Table</div>,
}));
vi.mock('../components/employees/MobileList', () => ({
  MobileList: () => <div data-testid="mobile-list">Mobile List</div>,
}));


import { useEmployeeTable } from '../hooks/useEmployeeTable';
import { useMediaQuery } from '../hooks/useMediaQuery';

const queryClient = new QueryClient();

const mockEmployeeData = {
  employees: [{ id: 1, first_name: 'Test', last_name: 'User', employee_email: 'test@example.com', status: 'Active' }],
  pagination: { currentPage: 1, totalPages: 1, totalCount: 1, limit: 20 },
  sorting: { sortBy: 'first_name', sortOrder: 'asc' },
  filters: { status: 'all' },
  isLoading: false,
  setPagination: vi.fn(),
  setSorting: vi.fn(),
  setFilters: vi.fn(),
  searchInputValue: '',
  setSearchInputValue: vi.fn(),
};

describe('EmployeeListPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    useEmployeeTable.mockClear();
    useMediaQuery.mockClear();
  });

  it('should render the DesktopTable on larger screens', () => {
    useEmployeeTable.mockReturnValue(mockEmployeeData);
    useMediaQuery.mockReturnValue(true); // Simulate desktop

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeListPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByTestId('desktop-table')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-list')).not.toBeInTheDocument();
  });

  it('should render the MobileList on smaller screens', () => {
    useEmployeeTable.mockReturnValue(mockEmployeeData);
    useMediaQuery.mockReturnValue(false); // Simulate mobile

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeListPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByTestId('mobile-list')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-table')).not.toBeInTheDocument();
  });

  it('should render the EmptyState component when there are no employees', () => {
    useEmployeeTable.mockReturnValue({
      ...mockEmployeeData,
      employees: [],
    });
    useMediaQuery.mockReturnValue(true); // Can be true or false

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeListPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByText(/No Employees Found/i)).toBeInTheDocument();
  });
});