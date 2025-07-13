import { renderHook, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployeeTable } from './useEmployeeTable';

// 1. Create a mock server
const server = setupServer(
  http.get('*/api/employees', () => {
    return HttpResponse.json({
      employees: [{ id: 1, first_name: 'John', last_name: 'Doe' }],
      totalPages: 1,
      totalCount: 1,
    });
  })
);

// 2. Set up the server and a wrapper for react-query
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Turn off retries for tests
      },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// 3. Write the test
test('should fetch employees and set initial state', async () => {
  const wrapper = createWrapper();
  const { result } = renderHook(() => useEmployeeTable(), { wrapper });

  // Use waitFor to handle the asynchronous state update
  await waitFor(() => {
    // Assert that the hook's state is updated with the mock data
    expect(result.current.employees.length).toBe(1);
    expect(result.current.employees[0].first_name).toBe('John');
    expect(result.current.isLoading).toBe(false);
  });
});