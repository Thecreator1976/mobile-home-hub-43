import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Target } from "lucide-react";

interface FinancialInfoData {
  askingPrice: number;
  owedAmount: number;
  estimatedValue: number;
  targetOffer: number;
  notes: string;
}

interface FinancialInfoFormProps {
  data: FinancialInfoData;
  onChange: (field: string, value: string | number | boolean | null) => void;
  calculatedEstimatedValue?: number;
  calculatedTargetOffer?: number;
}

export default function FinancialInfoForm({ 
  data, 
  onChange, 
  calculatedEstimatedValue,
  calculatedTargetOffer 
}: FinancialInfoFormProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const equity = data.askingPrice - (data.owedAmount || 0);
  const margin = (data.estimatedValue || calculatedEstimatedValue || 0) - (data.targetOffer || calculatedTargetOffer || 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="askingPrice">Asking Price *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="askingPrice"
              type="number"
              value={data.askingPrice || ""}
              onChange={(e) => onChange("askingPrice", parseInt(e.target.value) || 0)}
              placeholder="50000"
              className="pl-9"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="owedAmount">Amount Owed</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="owedAmount"
              type="number"
              value={data.owedAmount || ""}
              onChange={(e) => onChange("owedAmount", parseInt(e.target.value) || 0)}
              placeholder="0"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="estimatedValue">Estimated Value</Label>
          <div className="relative">
            <TrendingUp className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="estimatedValue"
              type="number"
              value={data.estimatedValue || calculatedEstimatedValue || ""}
              onChange={(e) => onChange("estimatedValue", parseInt(e.target.value) || 0)}
              placeholder="Auto-calculated or enter manually"
              className="pl-9"
            />
          </div>
          {calculatedEstimatedValue && !data.estimatedValue && (
            <p className="text-xs text-muted-foreground">
              Calculated: {formatCurrency(calculatedEstimatedValue)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetOffer">Target Offer</Label>
          <div className="relative">
            <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="targetOffer"
              type="number"
              value={data.targetOffer || calculatedTargetOffer || ""}
              onChange={(e) => onChange("targetOffer", parseInt(e.target.value) || 0)}
              placeholder="Auto-calculated or enter manually"
              className="pl-9"
            />
          </div>
          {calculatedTargetOffer && !data.targetOffer && (
            <p className="text-xs text-muted-foreground">
              Calculated: {formatCurrency(calculatedTargetOffer)}
            </p>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Seller Equity</p>
              <p className={`text-2xl font-bold ${equity >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(equity)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Potential Margin</p>
              <p className={`text-2xl font-bold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(margin)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <Label htmlFor="financialNotes">Financial Notes</Label>
        <Textarea
          id="financialNotes"
          value={data.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="Notes about financing, liens, or other financial considerations..."
          rows={3}
        />
      </div>
    </div>
  );
}
