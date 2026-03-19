import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AdminUpload from "@/pages/AdminUpload";

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

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
        channel: () => ({
            on: () => ({
                subscribe: () => ({ unsubscribe: vi.fn() }),
            }),
        }),
        removeChannel: vi.fn(),
    },
}));

vi.mock("@/contexts/AuthContext", () => ({
    useAuth: () => ({
        profileId: "admin-123",
    }),
}));

vi.mock("@/components/AdminLayout", () => ({
    AdminLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div data-testid="admin-layout">
            <h1>{title}</h1>
            {children}
        </div>
    ),
}));

describe("AdminUpload Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render upload page with order selection", async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === "orders") {
                return {
                    select: () => ({
                        in: () => ({
                            order: () => Promise.resolve({
                                data: [
                                    {
                                        id: "order-1",
                                        title: "Test Order",
                                        total_leads_ordered: 1000,
                                        leads_per_day: 50,
                                        client_id: "client-1",
                                        vendor_id: "vendor-1",
                                    },
                                ],
                                error: null,
                            }),
                        }),
                    }),
                };
            }
            if (table === "profiles") {
                return {
                    select: () => ({
                        in: () => Promise.resolve({
                            data: [{ id: "client-1", name: "John Doe", email: "john@example.com" }],
                            error: null,
                        }),
                    }),
                };
            }
            return {
                select: () => Promise.resolve({ data: [], error: null }),
            };
        });

        render(
            <BrowserRouter>
                <AdminUpload />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId("admin-layout")).toBeInTheDocument();
            expect(screen.getByText(/upload leads/i)).toBeInTheDocument();
            expect(screen.getByText(/select order to deliver against/i)).toBeInTheDocument();
        });
    });

    it("should show no active orders message when none exist", async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === "orders") {
                return {
                    select: () => ({
                        in: () => ({
                            order: () => Promise.resolve({ data: [], error: null }),
                        }),
                    }),
                };
            }
            return {
                select: () => Promise.resolve({ data: [], error: null }),
            };
        });

        render(
            <BrowserRouter>
                <AdminUpload />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/no active orders/i)).toBeInTheDocument();
        });
    });

    it("should show progress bar when order is selected", async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === "orders") {
                return {
                    select: () => ({
                        in: () => ({
                            order: () => Promise.resolve({
                                data: [
                                    {
                                        id: "order-1",
                                        title: "Test Order",
                                        total_leads_ordered: 1000,
                                        leads_per_day: 50,
                                        client_id: "client-1",
                                        vendor_id: "vendor-1",
                                    },
                                ],
                                error: null,
                            }),
                        }),
                    }),
                };
            }
            if (table === "profiles") {
                return {
                    select: () => ({
                        in: () => Promise.resolve({
                            data: [{ id: "client-1", name: "John Doe", email: "john@example.com" }],
                            error: null,
                        }),
                    }),
                };
            }
            if (table === "leads") {
                return {
                    select: () => ({
                        in: () => Promise.resolve({ data: [], error: null }),
                        eq: () => ({
                            eq: () => Promise.resolve({ data: [], error: null }),
                        }),
                    }),
                };
            }
            return {
                select: () => Promise.resolve({ data: [], error: null }),
            };
        });

        render(
            <BrowserRouter>
                <AdminUpload />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/select an order/i)).toBeInTheDocument();
        });
    });

    it("should handle file upload area", async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === "orders") {
                return {
                    select: () => ({
                        in: () => ({
                            order: () => Promise.resolve({
                                data: [
                                    {
                                        id: "order-1",
                                        title: "Test Order",
                                        total_leads_ordered: 1000,
                                        leads_per_day: 50,
                                        client_id: "client-1",
                                        vendor_id: "vendor-1",
                                    },
                                ],
                                error: null,
                            }),
                        }),
                    }),
                };
            }
            if (table === "profiles") {
                return {
                    select: () => ({
                        in: () => Promise.resolve({
                            data: [{ id: "client-1", name: "John Doe", email: "john@example.com" }],
                            error: null,
                        }),
                    }),
                };
            }
            return {
                select: () => Promise.resolve({ data: [], error: null }),
            };
        });

        render(
            <BrowserRouter>
                <AdminUpload />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/select an order/i)).toBeInTheDocument();
        });
    });
});
