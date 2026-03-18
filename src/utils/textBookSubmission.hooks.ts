
import { useState, useCallback, useEffect } from 'react';
import type { TextBookSubmission, PaginatedResponse } from '../pages/textBookSubmission/types/textBookTypes';
import { getAdminSubmissions } from '../services/textBookService';

export const useAdminTextBookSubmissions = (page: number = 1, limit: number = 50, filters?: { status?: string, search?: string, isDirectSubmission?: boolean, isBulkSubmission?: boolean, showAll?: boolean }) => {
    const [submissions, setSubmissions] = useState<TextBookSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        currentPage: page,
        totalPages: 0,
        totalCount: 0,
    });

    const fetchSubmissions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getAdminSubmissions({
                page,
                limit,
                status: filters?.status,
                search: filters?.search,
                isDirectSubmission: filters?.isDirectSubmission,
                isBulkSubmission: filters?.isBulkSubmission,
                showAll: filters?.showAll
            });

            // Response is already unwrapped in the service
            setSubmissions(response.submissions || []);
            setPagination({
                currentPage: response.pagination.page,
                totalPages: response.pagination.totalPages || 0,
                totalCount: response.pagination.total || 0,
            });

        } catch (err: any) {
            setError(err.message || 'Failed to fetch submissions');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, filters?.status, filters?.search, filters?.isDirectSubmission, filters?.isBulkSubmission, filters?.showAll]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    return {
        submissions,
        isLoading,
        error,
        pagination,
        refetch: fetchSubmissions,
    };
};
