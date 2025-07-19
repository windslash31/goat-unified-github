import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * A custom hook for handling API mutations
 * @param {object} options
 * @param {function} options.mutationFn
 * @param {string} options.queryKeyToInvalidate
 * @param {string} options.successMessage
 * @param {string} options.errorMessage 
 * @returns 
 */

const useApiMutation = ({
  mutationFn,
  queryKeyToInvalidate,
  successMessage = 'Action completed successfully!',
  errorMessage = 'An error occurred',
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage);
      if (queryKeyToInvalidate) {
        queryClient.invalidateQueries([queryKeyToInvalidate]);
      }
    },
    onError: (error) => {
      const specificMessage = error.response?.data?.message || errorMessage;
      toast.error(specificMessage);
    },
  });
};

export default useApiMutation;