import { redirect } from "next/navigation";
import { getViewer } from "@/lib/data";

export default async function SettingsPage() {
  const { user } = await getViewer();
  if (!user) redirect("/login?redirect=/settings");
  redirect(`/profile/${user.id}`);
}
