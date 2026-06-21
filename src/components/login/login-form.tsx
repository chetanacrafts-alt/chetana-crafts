"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState | undefined, FormData>(
    login,
    undefined
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Chetana Crafts</CardTitle>
        <CardDescription>Enter the passcode to access the dashboard.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-1.5">
          <Label htmlFor="passcode">Passcode</Label>
          <Input id="passcode" name="passcode" type="password" autoFocus required />
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending} className="w-full">
            <KeyRound className="size-4" />
            {pending ? "Checking…" : "Unlock"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
