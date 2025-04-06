"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SourceFileUploader() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setError("Please select a JSON file.");
      return;
    }

    setSelectedFile(file);
  };

  const handleProcessFile = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    setIsProcessing(true);
    setError(undefined);

    try {
      // Read the file contents
      const fileContent = await selectedFile.text();
      const json = JSON.parse(fileContent);

      // Store in sessionStorage
      sessionStorage.setItem("uploadedJsonData", fileContent);

      // Navigate based on content
      if (json.parts) {
        router.push("/transcript");
      } else if (json.pages) {
        router.push("/book");
      } else {
        throw new Error(
          "Unknown JSON structure. The file must contain either 'transcripts' or 'pages'."
        );
      }
    } catch (error_: any) {
      setError(error_.message || "Failed to process the JSON file.");
      console.error(error_);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <Input
        accept=".json"
        disabled={isProcessing}
        id="source"
        onChange={handleFileChange}
        type="file"
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        disabled={!selectedFile || isProcessing}
        onClick={handleProcessFile}
      >
        {isProcessing ? "Processing..." : "Process File"}
      </Button>

      {selectedFile && !isProcessing && (
        <p className="text-sm text-muted-foreground">
          Selected: {selectedFile.name}
        </p>
      )}
    </div>
  );
}
