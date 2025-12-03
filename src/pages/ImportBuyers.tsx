import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useBuyers, CreateBuyerInput } from "@/hooks/useBuyers";
import { HomeType } from "@/hooks/useSellerLeads";

interface ParsedBuyer {
  name: string;
  phone: string;
  email: string;
  minPrice: number;
  maxPrice: number;
  homeTypes: HomeType[];
  locations: string[];
  creditScore: number;
  notes: string;
  valid: boolean;
  errors: string[];
}

export default function ImportBuyers() {
  const navigate = useNavigate();
  const { createBuyer } = useBuyers();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedBuyer[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);

  const parseCSV = useCallback((text: string): ParsedBuyer[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const buyers: ParsedBuyer[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const errors: string[] = [];

      const getValue = (key: string): string => {
        const index = headers.indexOf(key);
        return index >= 0 ? values[index] || "" : "";
      };

      const name = getValue("name") || getValue("full_name") || getValue("buyer_name");
      if (!name) errors.push("Name is required");

      const phone = getValue("phone") || getValue("phone_number");
      const email = getValue("email") || getValue("email_address");

      const minPriceStr = getValue("min_price") || getValue("minimum_price") || getValue("budget_min") || "0";
      const maxPriceStr = getValue("max_price") || getValue("maximum_price") || getValue("budget_max") || "0";
      const minPrice = parseInt(minPriceStr.replace(/[^0-9]/g, "")) || 0;
      const maxPrice = parseInt(maxPriceStr.replace(/[^0-9]/g, "")) || 0;

      const homeTypesStr = getValue("home_types") || getValue("home_type") || getValue("types") || "";
      const homeTypes: HomeType[] = homeTypesStr
        .toLowerCase()
        .split(/[,;|]/)
        .map((t) => t.trim())
        .filter((t): t is HomeType => ["single", "double", "triple"].includes(t));

      const locationsStr = getValue("locations") || getValue("location") || getValue("areas") || "";
      const locations = locationsStr.split(/[,;|]/).map((l) => l.trim()).filter(Boolean);

      const creditScoreStr = getValue("credit_score") || getValue("credit") || getValue("fico") || "0";
      const creditScore = parseInt(creditScoreStr.replace(/[^0-9]/g, "")) || 0;

      const notes = getValue("notes") || getValue("comments") || "";

      buyers.push({
        name,
        phone,
        email,
        minPrice,
        maxPrice,
        homeTypes,
        locations,
        creditScore,
        notes,
        valid: errors.length === 0,
        errors,
      });
    }

    return buyers;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setParsedData(parsed);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    const validBuyers = parsedData.filter((b) => b.valid);
    if (validBuyers.length === 0) {
      toast({
        title: "No Valid Data",
        description: "No valid buyers to import.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < validBuyers.length; i++) {
      const buyer = validBuyers[i];
      try {
        const input: CreateBuyerInput = {
          name: buyer.name,
          phone: buyer.phone || undefined,
          email: buyer.email || undefined,
          min_price: buyer.minPrice || undefined,
          max_price: buyer.maxPrice || undefined,
          home_types: buyer.homeTypes.length > 0 ? buyer.homeTypes : undefined,
          locations: buyer.locations.length > 0 ? buyer.locations : undefined,
          credit_score: buyer.creditScore || undefined,
          notes: buyer.notes || undefined,
        };

        await createBuyer.mutateAsync(input);
        success++;
      } catch (error) {
        failed++;
      }

      setProgress(((i + 1) / validBuyers.length) * 100);
    }

    setImporting(false);
    setImportResults({ success, failed });

    toast({
      title: "Import Complete",
      description: `Successfully imported ${success} buyers. ${failed > 0 ? `${failed} failed.` : ""}`,
    });
  };

  const validCount = parsedData.filter((b) => b.valid).length;
  const invalidCount = parsedData.filter((b) => !b.valid).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Import Buyers</h1>
            <p className="text-muted-foreground">
              Upload a CSV file to bulk import buyers
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Your CSV should include columns: name, phone, email, min_price, max_price, home_types, locations, credit_score, notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-8">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button asChild variant="outline">
                    <span className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Select CSV File
                    </span>
                  </Button>
                </label>
                {file && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>

            {/* Sample Format */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Sample CSV Format:</p>
              <code className="text-xs block overflow-x-auto whitespace-nowrap">
                name,phone,email,min_price,max_price,home_types,locations,credit_score,notes
                <br />
                John Doe,(555) 123-4567,john@email.com,20000,50000,single|double,Phoenix|Mesa,680,First time buyer
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {parsedData.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  {parsedData.length} records found • {validCount} valid • {invalidCount} with errors
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
                  {validCount} Valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="outline" className="bg-red-50">
                    <XCircle className="mr-1 h-3 w-3 text-red-600" />
                    {invalidCount} Invalid
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Home Types</TableHead>
                      <TableHead>Locations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((buyer, index) => (
                      <TableRow key={index} className={!buyer.valid ? "bg-red-50" : ""}>
                        <TableCell>
                          {buyer.valid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <span className="text-xs text-red-600">{buyer.errors.join(", ")}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{buyer.name || "-"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {buyer.phone && <div>{buyer.phone}</div>}
                            {buyer.email && <div className="text-muted-foreground">{buyer.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          ${buyer.minPrice.toLocaleString()} - ${buyer.maxPrice.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {buyer.homeTypes.length > 0 ? buyer.homeTypes.join(", ") : "-"}
                        </TableCell>
                        <TableCell>
                          {buyer.locations.length > 0 ? buyer.locations.join(", ") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Import Progress */}
              {importing && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Import Results */}
              {importResults && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center gap-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">Import Complete</p>
                    <p className="text-sm text-muted-foreground">
                      {importResults.success} imported successfully
                      {importResults.failed > 0 && `, ${importResults.failed} failed`}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => navigate("/buyers")}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || validCount === 0 || !!importResults}
                >
                  {importing ? "Importing..." : `Import ${validCount} Buyers`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
