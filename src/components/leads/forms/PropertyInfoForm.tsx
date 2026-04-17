import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

interface PropertyInfoData {
  homeType: string;
  yearBuilt: number;
  condition: number;
  length: number;
  width: number;
  parkOwned: boolean;
  lotRent: number;
}

interface PropertyInfoFormProps {
  data: PropertyInfoData;
  onChange: (field: string, value: string | number | boolean | null) => void;
  onCalculate?: () => void;
}

export default function PropertyInfoForm({ data, onChange, onCalculate }: PropertyInfoFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="homeType">Home Type</Label>
          <Select value={data.homeType} onValueChange={(value) => onChange("homeType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select home type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Wide</SelectItem>
              <SelectItem value="double">Double Wide</SelectItem>
              <SelectItem value="triple">Triple Wide</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="yearBuilt">Year Built</Label>
          <Input
            id="yearBuilt"
            type="number"
            value={data.yearBuilt || ""}
            onChange={(e) => onChange("yearBuilt", parseInt(e.target.value) || null)}
            placeholder="2010"
            min={1950}
            max={new Date().getFullYear()}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition">Condition (1-5)</Label>
        <Select 
          value={data.condition?.toString() || ""} 
          onValueChange={(value) => onChange("condition", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Poor</SelectItem>
            <SelectItem value="2">2 - Fair</SelectItem>
            <SelectItem value="3">3 - Good</SelectItem>
            <SelectItem value="4">4 - Very Good</SelectItem>
            <SelectItem value="5">5 - Excellent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="length">Length (ft)</Label>
          <Input
            id="length"
            type="number"
            value={data.length || ""}
            onChange={(e) => onChange("length", parseInt(e.target.value) || null)}
            placeholder="60"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="width">Width (ft)</Label>
          <Input
            id="width"
            type="number"
            value={data.width || ""}
            onChange={(e) => onChange("width", parseInt(e.target.value) || null)}
            placeholder="14"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="parkOwned">Park Owned Land</Label>
          <p className="text-sm text-muted-foreground">
            Is the home on park-owned land?
          </p>
        </div>
        <Switch
          id="parkOwned"
          checked={data.parkOwned}
          onCheckedChange={(checked) => onChange("parkOwned", checked)}
        />
      </div>

      {data.parkOwned && (
        <div className="space-y-2">
          <Label htmlFor="lotRent">Monthly Lot Rent ($)</Label>
          <Input
            id="lotRent"
            type="number"
            value={data.lotRent || ""}
            onChange={(e) => onChange("lotRent", parseInt(e.target.value) || null)}
            placeholder="500"
          />
        </div>
      )}

      {onCalculate && (
        <Button type="button" variant="outline" onClick={onCalculate} className="w-full">
          <Calculator className="mr-2 h-4 w-4" />
          Calculate Estimated Value
        </Button>
      )}
    </div>
  );
}
