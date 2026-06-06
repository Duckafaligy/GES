import { notFound } from "next/navigation";
import { findClientById } from "@/lib/clients";
import ClientPreviewPage from "./ClientPreviewPage";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function PreviewPage({ params }: Props) {
  const { clientId } = await params;
  const client = findClientById(clientId);
  if (!client) notFound();

  return <ClientPreviewPage client={client} />;
}
