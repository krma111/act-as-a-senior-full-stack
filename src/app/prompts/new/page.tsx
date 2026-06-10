import { redirect } from "next/navigation";

export default function NewPromptRedirect() {
  redirect("/dashboard/upload");
}
