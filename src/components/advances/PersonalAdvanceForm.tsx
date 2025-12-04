import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, DollarSign, Percent, Save, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { usePersonalAdvances, CreateAdvanceInput } from "@/hooks/usePersonalAdvances";
import { useSellerLeads } from "@/hooks/useSellerLeads";

interface PersonalAdvanceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PersonalAdvanceForm({ onSuccess, onCancel }: PersonalAdvanceFormProps) {
  const { createAdvance } = usePersonalAdvances();
  const { leads } = useSellerLeads();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateAdvanceInput>({
    seller_lead_id: null,
    amount: 0,
    purpose: "",
    interest_rate: 0,
    repayment_terms: "",
    issued_date: new Date().toISOString().split('T')[0],
    due_date: null,
    notes: "",
  });

  const [issuedDate, setIssuedDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      return;
    }

    setLoading(true);
    try {
      await createAdvance.mutateAsync({
        ...formData,
        issued_date: format(issuedDate, 'yyyy-MM-dd'),
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
      });
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="pl-9"
              value={formData.amount || ""}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                amount: parseFloat(e.target.value) || 0,
              }))}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interest_rate">Interest Rate (%)</Label>
          <div className="relative">
            <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="interest_rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="0"
              className="pl-9"
              value={formData.interest_rate || ""}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                interest_rate: parseFloat(e.target.value) || 0,
              }))}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seller_lead_id">Related Lead</Label>
        <Select
          value={formData.seller_lead_id || "none"}
          onValueChange={(value) => setFormData(prev => ({
            ...prev,
            seller_lead_id: value === "none" ? null : value,
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select lead (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {leads?.map((lead) => (
              <SelectItem key={lead.id} value={lead.id}>
                {lead.name} - {lead.address}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose *</Label>
        <Input
          id="purpose"
          placeholder="Purpose of the advance"
          value={formData.purpose}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            purpose: e.target.value,
          }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="repayment_terms">Repayment Terms</Label>
        <Input
          id="repayment_terms"
          placeholder="e.g., Monthly payments of $500"
          value={formData.repayment_terms || ""}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            repayment_terms: e.target.value,
          }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Issued Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !issuedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {issuedDate ? format(issuedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={issuedDate}
                onSelect={(date) => date && setIssuedDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes..."
          className="min-h-[80px]"
          value={formData.notes || ""}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            notes: e.target.value,
          }))}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading || formData.amount <= 0}>
          {loading ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Advance
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
