import VaultView from "@/components/VaultView";
import { vaultDrops } from "@/data/vault";
import { getServerMembership } from "@/lib/membership-server";
import { visibleDrops } from "@/lib/vault-gate";

/*
 * Members-only on the server (security review TZS-2, EBE-6325). Until engine 2.8.11 this page
 * was a client component that shipped every insider drop, its title, text and link, to every
 * visitor and only blurred it. Now the hub is asked here, with the visitor's session cookie,
 * and a non-member's page carries an insider drop's type and date and nothing else.
 */
export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const { member } = await getServerMembership();
  return <VaultView drops={visibleDrops(vaultDrops, member)} member={member} />;
}
