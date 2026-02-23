"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type VerificationResult = {
  valid: boolean;
  userName?: string;
  courseTitle?: string;
  completedOn?: string;
  error?: string;
};

export default function CertificateVerificationPage() {
  const [certificateId, setCertificateId] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!certificateId.trim()) {
      setResult({
        valid: false,
        error: "Please enter a certificate ID",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/courses/certificate/verify/${encodeURIComponent(certificateId.trim())}`,
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Certificate verification error:", error);
      setResult({
        valid: false,
        error: "Failed to verify certificate. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Certificate Verification
          </CardTitle>
          <p className="text-center text-muted-foreground text-sm">
            Enter the certificate ID to verify its authenticity
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Certificate ID"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="text-center font-mono"
            />
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Certificate"
            )}
          </Button>

          {result && (
            <div
              className={`mt-6 p-4 rounded-lg border-2 ${
                result.valid
                  ? "bg-green-50 border-green-500 dark:bg-green-950 dark:border-green-700"
                  : "bg-red-50 border-red-500 dark:bg-red-950 dark:border-red-700"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.valid ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}

                <div className="flex-1 space-y-2">
                  <h3
                    className={`font-semibold text-lg ${
                      result.valid
                        ? "text-green-900 dark:text-green-100"
                        : "text-red-900 dark:text-red-100"
                    }`}
                  >
                    {result.valid ? "Valid Certificate" : "Invalid Certificate"}
                  </h3>

                  {result.valid ? (
                    <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                      <p>
                        <strong>Recipient:</strong> {result.userName}
                      </p>
                      <p>
                        <strong>Course:</strong> {result.courseTitle}
                      </p>
                      <p>
                        <strong>Completed:</strong>{" "}
                        {result.completedOn
                          ? new Date(result.completedOn).toLocaleDateString(
                              "sv-SE",
                            )
                          : "N/A"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {result.error ||
                        "This certificate could not be found in our system."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
