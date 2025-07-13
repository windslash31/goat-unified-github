import React from 'react';
import { UserSearch } from 'lucide-react';

export const EmptyState = () => (
    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <UserSearch className="mx-auto w-12 h-12 text-gray-400" />
        <p className="font-semibold mt-4">No Employees Found</p>
        <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
    </div>
);