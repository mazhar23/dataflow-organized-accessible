import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Register from "@/pages/Register";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockSignUp = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        auth: {
            signUp: (...args: any[]) => mockSignUp(...args),
        },
    },
}));

vi.mock("sonner", () => ({
    toast: {
        success: (msg: string) => mockToastSuccess(msg),
        error: (msg: string) => mockToastError(msg),
    },
}));

vi.mock("@/contexts/AuthContext", () => ({
    useAuth: () => ({
        session: null,
        loading: false,
    }),
}));

describe("Register Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render registration form with all required fields", () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    });

    it("should show error when passwords do not match", async () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        const nameInput = screen.getByLabelText(/full name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password/i);
        const confirmInput = screen.getByLabelText(/confirm password/i);
        const submitBtn = screen.getByRole("button", { name: /create account/i });

        fireEvent.change(nameInput, { target: { value: "John Doe" } });
        fireEvent.change(emailInput, { target: { value: "john@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.change(confirmInput, { target: { value: "differentpassword" } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith("Passwords do not match");
        });

        expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should call signUp with correct data when form is valid", async () => {
        mockSignUp.mockResolvedValueOnce({ error: null });

        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        const nameInput = screen.getByLabelText(/full name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password/i);
        const confirmInput = screen.getByLabelText(/confirm password/i);
        const companyInput = screen.getByLabelText(/company/i);
        const submitBtn = screen.getByRole("button", { name: /create account/i });

        fireEvent.change(nameInput, { target: { value: "John Doe" } });
        fireEvent.change(emailInput, { target: { value: "john@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.change(confirmInput, { target: { value: "password123" } });
        fireEvent.change(companyInput, { target: { value: "Acme Inc" } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith({
                email: "john@example.com",
                password: "password123",
                options: {
                    data: {
                        name: "John Doe",
                        company: "Acme Inc",
                    },
                },
            });
        });
    });

    it("should show success message and redirect on successful registration", async () => {
        mockSignUp.mockResolvedValueOnce({ error: null });

        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        const nameInput = screen.getByLabelText(/full name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password/i);
        const confirmInput = screen.getByLabelText(/confirm password/i);
        const submitBtn = screen.getByRole("button", { name: /create account/i });

        fireEvent.change(nameInput, { target: { value: "John Doe" } });
        fireEvent.change(emailInput, { target: { value: "john@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.change(confirmInput, { target: { value: "password123" } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockToastSuccess).toHaveBeenCalledWith("Account created! Please check your email to verify.");
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        });
    });

    it("should show error on registration failure", async () => {
        mockSignUp.mockResolvedValueOnce({
            error: { message: "Email already registered" },
        });

        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        const nameInput = screen.getByLabelText(/full name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password/i);
        const confirmInput = screen.getByLabelText(/confirm password/i);
        const submitBtn = screen.getByRole("button", { name: /create account/i });

        fireEvent.change(nameInput, { target: { value: "John Doe" } });
        fireEvent.change(emailInput, { target: { value: "existing@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.change(confirmInput, { target: { value: "password123" } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith("Email already registered");
        });

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should have link to login page", () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        const loginLink = screen.getByText(/log in/i);
        expect(loginLink).toHaveAttribute("href", "/login");
    });
});
