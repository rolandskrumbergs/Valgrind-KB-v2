"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordSuccessPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Card className="max-w-sm w-full bg-muted">
        <CardHeader>
          <CardTitle>Password Reset Successful</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Your password has been successfully reset. You can now access our
            mobile app with your new password.
          </p>

          <div className="flex flex-col gap-4">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() =>
                window.open("https://apps.apple.com/app/6746968887", "_blank")
              }
            >
              Download on the App Store
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() =>
                window.open(
                  "https://play.google.com/store/apps/details?id=com.intressebevakaren.kbapp",
                  "_blank",
                )
              }
            >
              Get it on Google Play
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
