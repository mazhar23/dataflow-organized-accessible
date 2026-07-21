// Mock Supabase client for testing
import { vi } from "vitest";

export const mockSupabase = {
    auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
                in: vi.fn(() => Promise.resolve({ data: [], error: null })),
                limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
            in: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
    })),
    channel: vi.fn(() => ({
        on: vi.fn(() => ({
            subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
    })),
    removeChannel: vi.fn(),
};

vi.mock("@/integrations/supabase/client", () => ({
    supabase: mockSupabase,
}));
