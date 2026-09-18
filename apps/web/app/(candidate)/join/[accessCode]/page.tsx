import { JoinPage } from "../../../../src/features/candidate/join-page";

export default async function Page(props: { params: Promise<{ accessCode: string }> }) {
    const params = await props.params;
    return <JoinPage initialAccessCode={params.accessCode} />;
}
