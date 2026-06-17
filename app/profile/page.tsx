import { redirect } from "next/navigation";
import { getViewer } from "@/lib/data";

export default async function ProfilePage() {
  const { user } = await getViewer();
  if (!user) redirect("/login?redirect=/profile");
  redirect(`/profile/${user.id}`);
}
