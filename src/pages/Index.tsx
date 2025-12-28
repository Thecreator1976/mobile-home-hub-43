import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight, Users, DollarSign, BarChart3, CheckCircle } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">MobileHome CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="animate-slide-up max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            The Complete CRM for{" "}
            <span className="bg-gradient-to-r from-primary to-status-new bg-clip-text text-transparent">
              Mobile Home
            </span>{" "}
            Investors
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your mobile home real estate business. Track leads, manage buyers, 
            handle expenses, and close more deals—all in one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gradient" size="xl" asChild>
              <Link to="/login">
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Access is by invitation only. Contact your administrator for an invite.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Users,
              title: "Lead Management",
              description: "Track seller leads from first contact to closing. Never lose a deal with our organized pipeline.",
              color: "bg-primary",
            },
            {
              icon: DollarSign,
              title: "Financial Tracking",
              description: "Monitor expenses, purchase orders, and personal advances. Keep your books clean and organized.",
              color: "bg-secondary",
            },
            {
              icon: BarChart3,
              title: "Analytics & Reports",
              description: "Make data-driven decisions with profit/loss reports and pipeline analytics.",
              color: "bg-status-closed",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-shadow animate-fade-in"
            >
              <div className={`${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-6`}>
                <feature.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-accent rounded-3xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-accent-foreground mb-4">
              Everything You Need to Scale Your Business
            </h2>
            <p className="text-accent-foreground/80">
              Built by investors, for investors. Every feature designed to help you close more deals.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "Property Value Estimator",
              "AI Contract Generation",
              "Buyer-Seller Matching",
              "Expense Receipt Upload",
              "Calendar Integration",
              "Purchase Order Tracking",
              "Promissory Notes",
              "Profit & Loss Reports",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-accent-foreground">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-muted-foreground mb-4">
            MobileHome CRM helps mobile home investors close more deals with powerful tools and insights.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Contact your organization administrator for an invitation to join.
          </p>
          <Button variant="gradient" size="xl" asChild>
            <Link to="/login">
              Sign In
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 MobileHome CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
