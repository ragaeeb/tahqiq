"use client";

import AppFooter from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TranscriptPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    try {
      const jsonData = sessionStorage.getItem("uploadedJsonData");

      if (!jsonData) {
        setError("No data found. Please upload a file from the home page.");
        return;
      }

      const parsedData = JSON.parse(jsonData);

      if (!parsedData.transcripts) {
        setError("Invalid data format: Missing transcripts.");
        return;
      }

      setData(parsedData);
    } catch (error_) {
      setError("Failed to load transcript data.");
      console.error(error_);
    }
  }, []);

  const handleBack = () => {
    router.push("/");
  };

  if (error) {
    return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center">
          <h1 className="text-2xl font-semibold text-destructive">Error</h1>
          <p>{error}</p>
          <Button onClick={handleBack}>Back to Home</Button>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center">
          <p>Loading transcript data...</p>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-start w-full max-w-4xl">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-2xl font-semibold">Transcript Viewer</h1>
          <Button onClick={handleBack} variant="outline">
            Back
          </Button>
        </div>

        <div className="w-full border rounded-lg p-4 bg-card text-card-foreground">
          <h2 className="text-lg font-medium mb-4">
            Transcripts ({data.transcripts.length})
          </h2>

          <div className="space-y-4">
            {data.transcripts.map((transcript: any, index: number) => (
              <div className="border-b pb-4 last:border-b-0" key={index}>
                <h3 className="font-medium mb-2">Transcript {index + 1}</h3>
                <pre className="whitespace-pre-wrap overflow-x-auto p-2 bg-muted rounded-md text-sm">
                  {JSON.stringify(transcript, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
