"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuthSupabaseClient } from "@/lib/supabase/server-auth";

export type LoginState = {
  error: string | null;
};

export async function signInAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createAuthSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Incorrect email or password. Please try again." };
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createAuthSupabaseClient();
  await supabase.auth.signOut();

  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
