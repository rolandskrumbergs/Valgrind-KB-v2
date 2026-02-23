"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { ForgotPassword } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await ForgotPassword(email);
      setSuccess(true);
    } catch (error) {
      console.error("Failed to send reset email:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send reset email",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Card className="max-w-sm w-full bg-muted">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              If an account exists with that email, we've sent password reset
              instructions.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full">Back to login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Card className="max-w-sm w-full bg-muted">
        <CardHeader>
          <CardTitle>Forgot password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your
            password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-center flex items-center gap-2 bg-destructive/10 p-2 rounded-md border border-destructive/40 text-red-500">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                "Send reset link"
              )}
            </Button>
            <Link
              href="/login"
              className="text-sm text-primary hover:underline text-center"
            >
              Back to login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
