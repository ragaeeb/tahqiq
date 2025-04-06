"use client";

import AppFooter from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BookPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    try {
      const jsonData = sessionStorage.getItem("uploadedJsonData");

      if (!jsonData) {
        setError("No data found. Please upload a file from the home page.");
        return;
      }

      const parsedData = JSON.parse(jsonData);

      if (!parsedData.pages) {
        setError("Invalid data format: Missing pages.");
        return;
      }

      setData(parsedData);
    } catch (error_) {
      setError("Failed to load book data.");
      console.error(error_);
    }
  }, []);

  const handleBack = () => {
    router.push("/");
  };

  const goToNextPage = () => {
    if (data && currentPage < data.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
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
          <p>Loading book data...</p>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-start w-full max-w-4xl">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-2xl font-semibold">Book Viewer</h1>
          <Button onClick={handleBack} variant="outline">
            Back
          </Button>
        </div>

        <div className="w-full border rounded-lg p-4 bg-card text-card-foreground">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">
              Page {currentPage + 1} of {data.pages.length}
            </h2>

            <div className="flex gap-2">
              <Button
                disabled={currentPage === 0}
                onClick={goToPreviousPage}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>

              <Button
                disabled={currentPage === data.pages.length - 1}
                onClick={goToNextPage}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-md overflow-x-auto">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(data.pages[currentPage], null, 2)}
            </pre>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
