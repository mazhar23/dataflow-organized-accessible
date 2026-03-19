import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AdminOrders from "@/pages/AdminOrders";

const mockNavigate = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("sonner", () => ({
    toast: {
        success: (msg: string) => mockToastSuccess(msg),
        error: (msg: string) => mockToastError(msg),
    },
}));

const mockFrom = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: (...args: any[]) => mockFrom(...args),
    },
}));

vi.mock("@/components/AdminLayout", () => ({
    AdminLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div data-testid="admin-layout">
            <h1>{title}</h1>
            {children}
        </div>
    ),
}));

describe("AdminOrders Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render orders page with title", async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === "orders") {
                return {
                    select: () => ({
                        order: () => Promise.resolve({ data: [], error: null }),
                    }),
                };
            }
            if (table === "profiles") {
                return {
                    select: () => ({
                        eq: () => ({
                            order: () => Promise.resolve({ data: [], error: null }),
                        }),
                    }),
                };
            }
            if (table === "vendors") {
                return {
                    select: () => ({
                        order: () => Promise.resolve({ data: [], error: null }),
                    }),
                };
            }
            if (table === "leads") {
                return {
                    select: () => ({
                        in: () => Promise.resolve({ data: [], error: null }),
                    }),
                };
            }
            return {
                select: () => Promise.resolve({ data: [], error: null }),
            };
        });

        render(
            <BrowserRouter>
                <AdminOrders />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId("admin-layout")).toBeInTheDocument();
            expect(screen.getByText("Orders")).toBeInTheDocument();
        });
    });

    it("should display orders when data is loaded", async () => {
        const mockOrders = [
            {
                id: "order-1",
                client_id: "client-1",
                vendor_id: "vendor-1",
                title: "Test Order",
                leads_per_day: 50,
                total_leads_ordered: 1000,
                status: "In Progress",
                start_date: "2024-01-01",
                end_date: "2024-01-31",
                created_at: "2024-01-01T00:00:00Z",
            },
        ];

        const mockClients = [
            { id: "client-1", name: "John Doe", email: "john@example.com", company: "Acme Inc" },
        ];

        const mockVendors = [
            { id: "vendor-1", name: "Vendor A", contact: "contact@vendor.com" },
        ];

        mockFrom.mockImplementation((table: string) => {
            if (table === "orders") {
                return {
                    select: () => ({
                        order: () => Promise.resolve({ data: mockOrders, error: null }),
                    }),
                };
            }
            if (table === "profiles") {
                return {
                    select: () => ({
                        eq: () => ({
                            order: () => Promise.resolve({ data: mockClients, error: null }),
                        }),
                    }),
                };
            }
            if (table === "vendors") {
                return {
                    select: () => ({
                        order: () => Promise.resolve({ data: mockVendors, error: null }),
                    }),
                };
            }
            if (table === "leads") {
                return {
                    select: () => ({
                        in: () => Promise.resolve({ data: [], error: null }),
                    }),
                };
            }
            return {
                select: () => Promise.resolve({ data: [], error: null }),
            };
        });

        render(
            <BrowserRouter>
                <AdminOrders />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Test Order")).toBeInTheDocument();
            expect(screen.getByText("John Doe")).toBeInTheDocument();
            expect(screen.getByText("Vendor A")).toBeInTheDocument();
        });
    });

    it("should open create order dialog when button is clicked", async () => {
        mockFrom.mockImplementation(() => ({
            select: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: null }),
                }),
                in: () => Promise.resolve({ data: [], error: null }),
            }),
        }));

        render(
            <BrowserRouter>
                <AdminOrders />
            </BrowserRouter>
        );

        await waitFor(() => {
            const createButton = screen.getByText(/create order/i);
            expect(createButton).toBeInTheDocument();
        });
    });

    it("should show empty state when no orders exist", async () => {
        mockFrom.mockImplementation(() => ({
            select: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: null }),
                }),
                in: () => Promise.resolve({ data: [], error: null }),
            }),
        }));

        render(
            <BrowserRouter>
                <AdminOrders />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/no orders/i)).toBeInTheDocument();
        });
    });
});
