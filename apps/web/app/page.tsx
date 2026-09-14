import { auth } from "../auth";
import LandingPage from "../src/components/landing/LandingPage";

export const metadata = {
    title: "SentinelX - Secure Assessment & Examination Platform",
    description: "SentinelX is a secure assessment and intelligent examination platform for institutions.",
};

export default async function HomePage() {
    const session = await auth();
    const isOrganizer = !!session?.user;

    return (
        <LandingPage isOrganizer={isOrganizer} />
    );
}
