import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ pagination, setPagination }) => {
    const { currentPage, totalPages, totalCount, limit } = pagination;
    if (totalCount === 0) return null;
    const from = (currentPage - 1) * limit + 1;
    const to = Math.min(currentPage * limit, totalCount);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">
                Showing <span className="font-semibold">{from}</span> to <span className="font-semibold">{to}</span> of <span className="font-semibold">{totalCount}</span> results
            </span>
            <div className="flex items-center gap-2">
                <button onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))} disabled={currentPage === 1} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronLeft className="w-5 h-5" /></button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))} disabled={currentPage === totalPages} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronRight className="w-5 h-5" /></button>
            </div>
        </div>
    );
};