import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Mock supabase
const mockUnsubscribe = vi.fn();
const mockSubscription = { unsubscribe: mockUnsubscribe };

const mockSupabase = {
    auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: mockSubscription } })),
        signOut: vi.fn(),
    },
    from: vi.fn(() => ({
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
                single: vi.fn(),
            })),
        })),
    })),
};

vi.mock("@/integrations/supabase/client", () => ({
    supabase: mockSupabase,
}));

// Test component that uses auth
function TestComponent() {
    const { user, userRole, profileId, loading, signOut } = useAuth();
    return (
        <div>
            <span data-testid="loading">{loading.toString()}</span>
            <span data-testid="user">{user ? user.email : "no-user"}</span>
            <span data-testid="role">{userRole || "no-role"}</span>
            <span data-testid="profileId">{profileId || "no-profile"}</span>
            <button data-testid="signout" onClick={signOut}>Sign Out</button>
        </div>
    );
}

describe("AuthContext", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should show loading initially", async () => {
        mockSupabase.auth.getSession.mockResolvedValueOnce({
            data: { session: null },
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId("loading").textContent).toBe("true");

        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("false");
        });
    });

    it("should set user and role when session exists", async () => {
        const mockUser = { id: "user-123", email: "test@example.com" };
        const mockSession = { user: mockUser };

        mockSupabase.auth.getSession.mockResolvedValueOnce({
            data: { session: mockSession },
        });

        mockSupabase.from.mockReturnValue({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                        data: { id: "profile-123", role: "admin" },
                        error: null,
                    }),
                })),
            })),
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("user").textContent).toBe("test@example.com");
            expect(screen.getByTestId("role").textContent).toBe("admin");
            expect(screen.getByTestId("profileId").textContent).toBe("profile-123");
        });
    });

    it("should default to client role when profile not found", async () => {
        const mockUser = { id: "user-456", email: "client@example.com" };
        const mockSession = { user: mockUser };

        mockSupabase.auth.getSession.mockResolvedValueOnce({
            data: { session: mockSession },
        });

        mockSupabase.from.mockReturnValue({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: { message: "Not found" },
                    }),
                })),
            })),
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("role").textContent).toBe("client");
        });
    });

    it("should call signOut when signOut is invoked", async () => {
        mockSupabase.auth.getSession.mockResolvedValueOnce({
            data: { session: null },
        });

        mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("false");
        });

        await act(async () => {
            screen.getByTestId("signout").click();
        });

        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it("should unsubscribe from auth state on unmount", async () => {
        mockSupabase.auth.getSession.mockResolvedValueOnce({
            data: { session: null },
        });

        const { unmount } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("false");
        });

        unmount();

        expect(mockUnsubscribe).toHaveBeenCalled();
    });
});
