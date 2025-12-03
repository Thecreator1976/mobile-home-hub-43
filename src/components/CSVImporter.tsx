import { useState, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { csvBuyerRowSchema, type CSVBuyerRow } from "@/lib/validations";

interface CSVImporterProps {
  onImport: (data: CSVBuyerRow[]) => Promise<void>;
  onCancel: () => void;
}

type ImportStatus = "idle" | "parsing" | "preview" | "importing" | "complete" | "error";

interface ParsedRow extends CSVBuyerRow {
  _rowNumber: number;
  _errors: string[];
  _valid: boolean;
}

export function CSVImporter({ onImport, onCancel }: CSVImporterProps) {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): string[][] => {
    const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
    return lines.map((line) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const processFile = useCallback(async (file: File) => {
    setStatus("parsing");
    setErrorMessage(null);

    try {
      const content = await file.text();
      const rows = parseCSV(content);

      if (rows.length < 2) {
        throw new Error("CSV must have a header row and at least one data row");
      }

      const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
      const requiredHeaders = ["name"];
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
      }

      const dataRows = rows.slice(1);
      const parsed: ParsedRow[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const obj: Record<string, string> = {};

        headers.forEach((header, index) => {
          obj[header] = row[index] || "";
        });

        const result = csvBuyerRowSchema.safeParse(obj);
        
        if (result.success) {
          parsed.push({
            ...result.data,
            _rowNumber: i + 2,
            _errors: [],
            _valid: true,
          });
        } else {
          const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
          parsed.push({
            name: obj.name || "",
            phone: obj.phone,
            email: obj.email,
            _rowNumber: i + 2,
            _errors: errors,
            _valid: false,
          });
        }
      }

      setParsedData(parsed);
      setStatus("preview");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to parse CSV");
      setStatus("error");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        setErrorMessage("Please upload a CSV file");
        setStatus("error");
        return;
      }
      processFile(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        if (!file.name.endsWith(".csv")) {
          setErrorMessage("Please upload a CSV file");
          setStatus("error");
          return;
        }
        processFile(file);
      }
    },
    [processFile]
  );

  const handleImport = async () => {
    const validRows = parsedData.filter((r) => r._valid);
    if (validRows.length === 0) {
      setErrorMessage("No valid rows to import");
      return;
    }

    setStatus("importing");
    setProgress(0);

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 100);

      await onImport(validRows);

      clearInterval(interval);
      setProgress(100);
      setStatus("complete");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Import failed");
      setStatus("error");
    }
  };

  const validCount = parsedData.filter((r) => r._valid).length;
  const invalidCount = parsedData.filter((r) => !r._valid).length;

  if (status === "idle" || status === "parsing") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Buyers from CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV file with buyer information. Required column: name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer",
              "hover:border-primary/50 hover:bg-muted/50 transition-colors"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {status === "parsing" ? "Processing..." : "Drop CSV file here or click to upload"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Supported columns: name, phone, email, min_price, max_price, locations, credit_score, notes
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => setStatus("idle")}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "complete") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-status-closed mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
            <p className="text-muted-foreground">
              Successfully imported {validCount} buyers
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={onCancel}>Done</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "importing") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileSpreadsheet className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold mb-4">Importing...</h3>
            <Progress value={progress} className="max-w-xs mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">
              {progress}% complete
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview state
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Import</CardTitle>
        <CardDescription>
          Review the data before importing. {validCount} valid rows, {invalidCount} with errors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invalidCount > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              {invalidCount} rows have errors and will be skipped during import.
            </AlertDescription>
          </Alert>
        )}

        <div className="border rounded-lg max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Row</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Price Range</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedData.slice(0, 50).map((row, i) => (
                <TableRow key={i} className={!row._valid ? "bg-destructive/5" : ""}>
                  <TableCell className="font-mono text-xs">{row._rowNumber}</TableCell>
                  <TableCell>
                    {row._valid ? (
                      <CheckCircle className="h-4 w-4 text-status-closed" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.phone || "-"}</TableCell>
                  <TableCell>{row.email || "-"}</TableCell>
                  <TableCell>
                    {row.min_price || row.max_price
                      ? `$${row.min_price || 0} - $${row.max_price || "∞"}`
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {parsedData.length > 50 && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Showing first 50 of {parsedData.length} rows
          </p>
        )}

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={() => setStatus("idle")}>
            Upload Different File
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleImport}
              disabled={validCount === 0}
            >
              Import {validCount} Buyers
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
