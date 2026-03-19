import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "@/pages/Login";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockSignInWithPassword = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        auth: {
            signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
        },
    },
}));

vi.mock("sonner", () => ({
    toast: {
        error: (msg: string) => mockToastError(msg),
    },
}));

vi.mock("@/contexts/AuthContext", () => ({
    useAuth: () => ({
        session: null,
        userRole: null,
        loading: false,
    }),
}));

describe("Login Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render login form with email and password fields", () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    });

    it("should show loading state while submitting", async () => {
        mockSignInWithPassword.mockImplementation(() => new Promise(() => { }));

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitBtn = screen.getByRole("button", { name: /log in/i });

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
        });
    });

    it("should call signInWithPassword with correct credentials", async () => {
        mockSignInWithPassword.mockResolvedValueOnce({ error: null });

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitBtn = screen.getByRole("button", { name: /log in/i });

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockSignInWithPassword).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "password123",
            });
        });
    });

    it("should show error toast on login failure", async () => {
        mockSignInWithPassword.mockResolvedValueOnce({
            error: { message: "Invalid credentials" },
        });

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitBtn = screen.getByRole("button", { name: /log in/i });

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith("Invalid credentials");
        });
    });

    it("should have link to forgot password page", () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        const forgotPasswordLink = screen.getByText(/forgot your password/i);
        expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
    });

    it("should have link to register page", () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        const registerLink = screen.getByText(/sign up/i);
        expect(registerLink).toHaveAttribute("href", "/register");
    });
});
