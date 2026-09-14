import { AppShell } from "../../src/components/layout/app-shell";
import { AuthProvider } from "../../src/components/auth-provider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <AppShell>{children}</AppShell>
        </AuthProvider>
    );
}
