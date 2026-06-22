import { redirect } from "next/navigation";

export default function RemovedProgressPage() {
  redirect("/dashboard/teams");
}
