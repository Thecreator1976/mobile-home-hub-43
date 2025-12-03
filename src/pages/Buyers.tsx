import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Upload, Phone, Mail, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

interface Buyer {
  id: string;
  name: string;
  phone: string;
  email: string;
  minPrice: number;
  maxPrice: number;
  homeTypes: string[];
  creditScore: number;
  status: "active" | "inactive" | "closed";
}

const mockBuyers: Buyer[] = [
  {
    id: "1",
    name: "Amanda Chen",
    phone: "(555) 111-2222",
    email: "achen@email.com",
    minPrice: 25000,
    maxPrice: 45000,
    homeTypes: ["single", "double"],
    creditScore: 680,
    status: "active",
  },
  {
    id: "2",
    name: "Marcus Williams",
    phone: "(555) 333-4444",
    email: "mwilliams@email.com",
    minPrice: 40000,
    maxPrice: 70000,
    homeTypes: ["double"],
    creditScore: 720,
    status: "active",
  },
  {
    id: "3",
    name: "Patricia Garcia",
    phone: "(555) 555-6666",
    email: "pgarcia@email.com",
    minPrice: 30000,
    maxPrice: 50000,
    homeTypes: ["single", "double", "triple"],
    creditScore: 650,
    status: "inactive",
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function Buyers() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Buyers</h1>
            <p className="text-muted-foreground">Manage your buyer database and match properties</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="gradient">
              <Plus className="h-4 w-4 mr-2" />
              Add Buyer
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search buyers..." className="pl-10" />
        </div>

        {/* Buyers Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockBuyers.map((buyer) => (
            <Card key={buyer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{buyer.name}</CardTitle>
                  <Badge
                    variant={buyer.status === "active" ? "closed" : buyer.status === "inactive" ? "outline" : "contract"}
                    className="mt-1"
                  >
                    {buyer.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Credit Score</p>
                  <p className="font-bold text-lg">{buyer.creditScore}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <a href={`tel:${buyer.phone}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {buyer.phone}
                  </a>
                  <a href={`mailto:${buyer.email}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </a>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Budget Range</span>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(buyer.minPrice)} - {formatCurrency(buyer.maxPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Interested In</p>
                  <div className="flex gap-2 flex-wrap">
                    {buyer.homeTypes.map((type) => (
                      <Badge key={type} variant="outline" className="capitalize">
                        {type} Wide
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/buyers/${buyer.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
