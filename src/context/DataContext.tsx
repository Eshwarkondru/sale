import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Student, StudentInput } from '../lib/types';
import { generateSampleStudents } from '../lib/seed';
import { useAuth } from './AuthContext';

interface DataContextValue {
  students: Student[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addStudent: (s: StudentInput) => Promise<{ error: string | null }>;
  updateStudent: (id: string, s: Partial<StudentInput>) => Promise<{ error: string | null }>;
  deleteStudent: (id: string) => Promise<{ error: string | null }>;
  bulkInsert: (rows: StudentInput[]) => Promise<{ error: string | null; inserted: number }>;
  seedIfEmpty: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('students').select('*').order('student_id');
    if (error) {
      setError(error.message);
      setStudents([]);
    } else {
      setStudents((data as Student[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) refresh();
    else {
      setStudents([]);
      setLoading(false);
    }
  }, [user, refresh]);

  const addStudent = useCallback(async (s: StudentInput) => {
    const { error } = await supabase.from('students').insert(s);
    if (error) return { error: error.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const updateStudent = useCallback(async (id: string, s: Partial<StudentInput>) => {
    const { error } = await supabase.from('students').update(s).eq('id', id);
    if (error) return { error: error.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const deleteStudent = useCallback(async (id: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) return { error: error.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const bulkInsert = useCallback(async (rows: StudentInput[]) => {
    const chunkSize = 500;
    let total = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from('students').insert(chunk);
      if (error) return { error: error.message, inserted: total };
      total += chunk.length;
    }
    await refresh();
    return { error: null, inserted: total };
  }, [refresh]);

  const seedIfEmpty = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
    if ((count ?? 0) === 0) {
      const sample = generateSampleStudents(1000);
      await bulkInsert(sample);
    } else {
      await refresh();
    }
  }, [user, bulkInsert, refresh]);

  return (
    <DataContext.Provider
      value={{ students, loading, error, refresh, addStudent, updateStudent, deleteStudent, bulkInsert, seedIfEmpty }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
