"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const passcode = String(formData.get("passcode") ?? "");
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    return { error: "App is not configured — APP_PASSWORD is not set." };
  }
  if (passcode !== expected) {
    return { error: "Incorrect passcode." };
  }

  await createSession();
  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
