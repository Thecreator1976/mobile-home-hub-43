import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
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
  const [csvData, setCsvData] = useState("");
  const [parsedData, setParsedData] = useState<ParsedBuyer[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const parseCSV = useCallback((text: string): ParsedBuyer[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[_\s]+/g, ""));
    const buyers: ParsedBuyer[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const errors: string[] = [];

      const getValue = (keys: string[]): string => {
        for (const key of keys) {
          const normalizedKey = key.toLowerCase().replace(/[_\s]+/g, "");
          const index = headers.indexOf(normalizedKey);
          if (index >= 0 && values[index]) return values[index];
        }
        return "";
      };

      const name = getValue(["name", "fullname", "buyername"]);
      if (!name) errors.push("Name is required");

      const phone = getValue(["phone", "phonenumber"]);
      const email = getValue(["email", "emailaddress"]);

      const minPriceStr = getValue(["minprice", "minimumprice", "budgetmin"]) || "0";
      const maxPriceStr = getValue(["maxprice", "maximumprice", "budgetmax"]) || "0";
      const minPrice = parseInt(minPriceStr.replace(/[^0-9]/g, "")) || 0;
      const maxPrice = parseInt(maxPriceStr.replace(/[^0-9]/g, "")) || 0;

      const homeTypesStr = getValue(["hometypes", "hometype", "types"]);
      const homeTypes: HomeType[] = homeTypesStr
        .toLowerCase()
        .split(/[,;|]/)
        .map((t) => t.trim().replace(/\s+wide/i, ""))
        .filter((t): t is HomeType => ["single", "double", "triple"].includes(t));

      const locationsStr = getValue(["locations", "location", "areas"]);
      const locations = locationsStr.split(/[,;|]/).map((l) => l.trim()).filter(Boolean);

      const creditScoreStr = getValue(["creditscore", "credit", "fico"]) || "0";
      const creditScore = parseInt(creditScoreStr.replace(/[^0-9]/g, "")) || 0;

      const notes = getValue(["notes", "comments"]);

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

  const handleParse = () => {
    if (!csvData.trim()) {
      toast({
        title: "No Data",
        description: "Please upload a file or paste CSV data.",
        variant: "destructive",
      });
      return;
    }

    try {
      setParseErrors([]);
      const parsed = parseCSV(csvData);
      
      if (parsed.length === 0) {
        setParseErrors(["CSV must have at least a header and one data row"]);
        return;
      }

      setParsedData(parsed);
      setImportResults(null);
      
      toast({
        title: "CSV Parsed",
        description: `Found ${parsed.length} records (${parsed.filter(b => b.valid).length} valid).`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to parse CSV";
      setParseErrors([message]);
      setParsedData([]);
    }
  };

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

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
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

  const downloadTemplate = () => {
    const template = `name,phone,email,minPrice,maxPrice,homeTypes,locations,creditScore,notes
John Doe,(555) 123-4567,john@example.com,50000,150000,"Single Wide, Double Wide","Springfield, Shelbyville",680,"Central AC, Updated Kitchen"
Jane Smith,(555) 987-6543,jane@example.com,80000,200000,Double Wide,Springfield,720,"New Roof, Appliances Included"`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buyer_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
              Bulk import buyers from CSV file
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file with buyer information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>CSV Template</Label>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={downloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Upload CSV</Label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label>Or Paste CSV Data</Label>
                <Textarea
                  placeholder="Paste CSV data here..."
                  className="min-h-[200px] font-mono text-sm"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleParse}
                  disabled={!csvData.trim()}
                  className="flex-1"
                >
                  Parse CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCsvData("");
                    setParsedData([]);
                    setParseErrors([]);
                    setImportResults(null);
                  }}
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Preview & Import</CardTitle>
              <CardDescription>
                Review data before importing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parseErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {parseErrors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-sm">{error}</div>
                      ))}
                      {parseErrors.length > 5 && (
                        <div className="text-sm">...and {parseErrors.length - 5} more errors</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {parsedData.length > 0 ? (
                <>
                  <Alert className={invalidCount > 0 ? "border-yellow-500" : ""}>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Ready to import {validCount} buyer{validCount !== 1 ? "s" : ""}
                      {invalidCount > 0 && ` (${invalidCount} invalid will be skipped)`}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Preview (First 5 rows)</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Budget</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.slice(0, 5).map((record, index) => (
                            <TableRow key={index} className={!record.valid ? "bg-destructive/10" : ""}>
                              <TableCell>
                                {record.valid ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{record.name || "-"}</TableCell>
                              <TableCell>{record.phone || "-"}</TableCell>
                              <TableCell>
                                ${record.minPrice.toLocaleString()} - ${record.maxPrice.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Import Progress */}
                  {importing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Importing...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}

                  {/* Import Results */}
                  {importResults && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {importResults.success} imported successfully
                        {importResults.failed > 0 && `, ${importResults.failed} failed`}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleImport}
                    disabled={importing || validCount === 0 || !!importResults}
                    className="w-full"
                  >
                    {importing ? (
                      <>
                        <Upload className="mr-2 h-4 w-4 animate-pulse" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import {validCount} Buyers
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No data to preview
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload or paste CSV data first
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CSV Format Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Format Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium">Required Columns:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li><code className="bg-muted px-1 rounded">name</code> - Buyer's full name</li>
                  <li><code className="bg-muted px-1 rounded">phone</code> - Phone number</li>
                  <li><code className="bg-muted px-1 rounded">email</code> - Email address</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Optional Columns:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li><code className="bg-muted px-1 rounded">minPrice</code> - Minimum budget</li>
                  <li><code className="bg-muted px-1 rounded">maxPrice</code> - Maximum budget</li>
                  <li><code className="bg-muted px-1 rounded">homeTypes</code> - Single, Double, Triple</li>
                  <li><code className="bg-muted px-1 rounded">locations</code> - Preferred locations</li>
                  <li><code className="bg-muted px-1 rounded">creditScore</code> - Credit score</li>
                  <li><code className="bg-muted px-1 rounded">notes</code> - Additional notes</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Tips:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Use the template to ensure correct format</li>
                  <li>Separate multiple values with commas</li>
                  <li>Empty rows will be skipped</li>
                  <li>Invalid rows show error details</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}