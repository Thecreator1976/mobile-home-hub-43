import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BasicInfoData {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

interface BasicInfoFormProps {
  data: BasicInfoData;
  onChange: (field: string, value: string) => void;
}

export default function BasicInfoForm({ data, onChange }: BasicInfoFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Seller Name *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="john@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Property Address *</Label>
        <Input
          id="address"
          value={data.address}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder="123 Main Street"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="Austin"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={data.state}
            onChange={(e) => onChange("state", e.target.value)}
            placeholder="TX"
            maxLength={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input
            id="zip"
            value={data.zip}
            onChange={(e) => onChange("zip", e.target.value)}
            placeholder="78701"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={data.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="Additional notes about the seller or property..."
          rows={4}
        />
      </div>
    </div>
  );
}
