import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { createJob as apiCreate, deleteJob as apiDelete, getJobs, updateJobStatus as apiUpdate } from '../api/jobsApi';
import type { Job, JobStatus } from '../types/job';

export const CONFLICT_MESSAGE =
  'This job was updated by another request. The latest status has been loaded.';

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getJobs();
      if (mounted.current) setJobs(data);
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'Unable to load jobs.');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createJob = useCallback(async (title: string, type: string): Promise<boolean> => {
    if (isCreating) return false;
    setIsCreating(true);
    setError(null);
    setNotice(null);
    try {
      const job = await apiCreate({ title, type });
      if (mounted.current) setJobs((prev) => [job, ...prev]);
      return true;
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to create job.');
      }
      return false;
    } finally {
      if (mounted.current) setIsCreating(false);
    }
  }, [isCreating]);

  const updateJobStatus = useCallback(async (id: string, status: JobStatus): Promise<void> => {
    setUpdatingJobId(id);
    setNotice(null);
    try {
      const updated = await apiUpdate(id, status);
      if (mounted.current) {
        setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        if (mounted.current) setNotice(CONFLICT_MESSAGE);
        await refetch();
      } else if (mounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to update job.');
        await refetch();
      }
    } finally {
      if (mounted.current) setUpdatingJobId(null);
    }
  }, [refetch]);

  const deleteJob = useCallback(async (id: string): Promise<void> => {
    setDeletingJobId(id);
    try {
      await apiDelete(id);
      if (mounted.current) setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to delete job.');
      }
      await refetch();
    } finally {
      if (mounted.current) setDeletingJobId(null);
    }
  }, [refetch]);

  const dismissNotice = useCallback(() => setNotice(null), []);
  const dismissError = useCallback(() => setError(null), []);

  return {
    jobs,
    loading,
    error,
    notice,
    isCreating,
    updatingJobId,
    deletingJobId,
    createJob,
    updateJobStatus,
    deleteJob,
    refetch,
    dismissError,
    dismissNotice,
  };
}
