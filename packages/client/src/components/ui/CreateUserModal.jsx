import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "./Button";
import { CustomSelect } from "./CustomSelect";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import useApiMutation from '../../hooks/useApiMutation';
import  api  from "../../api/api";

export const CreateUserModal = ({ roles, onClose, onUserCreated }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
  });

  const mutation = useApiMutation({
    mutationFn: (newUser) => api.post('/api/users', newUser),
    queryKeyToInvalidate: 'users',
    successMessage: 'User created successfully!',
    errorMessage: 'Failed to create user',
  });

  const onSubmit = (data) => {
    mutation.mutate(data, {
      onSuccess: (responseData) => {
        onUserCreated(responseData.data.temporaryPassword);
      },
    });
  };

  const roleOptions = roles.map((role) => ({ id: role.id, name: role.name }));

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New User
              </h3>
              <button type="button" onClick={onClose} /* ... */>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create a new application account. A temporary password will be
                generated.
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    {...register("fullName", { required: "Full name is required" })}
                    className="mt-1 w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    {...register("email", { required: "Email is required" })}
                    className="mt-1 w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                   {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label htmlFor="roleId" className="block text-sm font-medium">
                    Role
                  </label>
                  <Controller
                    name="roleId"
                    control={control}
                    rules={{ required: "Role is required" }}
                    render={({ field }) => (
                      <CustomSelect
                        id="roleId"
                        options={roleOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select a role..."
                      />
                    )}
                  />
                   {errors.roleId && <p className="text-red-500 text-xs mt-1">{errors.roleId.message}</p>}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex justify-end gap-3">
              <Button
                type="button"
                onClick={onClose}
                disabled={mutation.isLoading}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || mutation.isLoading}
                variant="primary"
              >
                {mutation.isLoading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};