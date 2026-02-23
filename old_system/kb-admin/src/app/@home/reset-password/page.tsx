"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  getUserById,
  updateUserAsInvitationAccepted,
} from "@/db/queries/user-queries";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const userId = searchParams.get("id") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    if (!token) {
      console.error("Reset password failed: Invalid or missing token");
      setError("Invalid or missing token.");
      setIsLoading(false);
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      console.error(
        "Reset password failed: Password must be at least 8 characters",
      );
      setError("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      console.error("Reset password failed: Passwords do not match");
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await authClient.resetPassword({
        newPassword,
        token,
      });
      if (error) {
        console.error(
          "Reset password failed:",
          error.message || "Failed to reset password",
          { token: token ? "present" : "missing" },
        );
        setError(error.message || "Failed to reset password.");
      } else {
        // If user has been invited and is resetting password for the first time,
        // we want to redirect them to a welcome page.

        const { data: userData } = await getUserById(userId);

        if (userData?.invited) {
          await updateUserAsInvitationAccepted(userId);
          router.push("/reset-password-success");
        } else {
          setSuccess(true);
          setTimeout(() => router.push("/login"), 2000);
        }
      }
    } catch (err) {
      console.error(
        "Reset password exception:",
        err instanceof Error ? err.message : "Failed to reset password",
        err,
      );
      setError(
        err instanceof Error ? err.message : "Failed to reset password.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Card className="max-w-sm w-full bg-muted">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below. Please confirm it to avoid typos.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-center flex items-center gap-2 bg-destructive/10 p-2 rounded-md border border-destructive/40 text-red-500">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-center flex flex-col items-center gap-2 bg-green-100 p-2 rounded-md border border-green-300 text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                Password reset! You can now return to the mobile app and log in
                with your new password.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  className="bg-background pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Enter new password"
                  disabled={isLoading || success}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading || success}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                className="bg-background"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Re-enter new password"
                disabled={isLoading || success}
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || success}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                "Reset Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
