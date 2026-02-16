import { redirect } from "next/navigation";

// Dashboard has been consolidated into My Shows
export default function DashboardPage() {
  redirect("/my-events");
}
