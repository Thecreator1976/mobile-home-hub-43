import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";

interface PropertyDescriptionGeneratorProps {
  property: {
    address: string;
    city?: string;
    state?: string;
    home_type: string;
    year_built?: number;
    length_ft?: number;
    width_ft?: number;
    condition?: number;
    asking_price?: number;
    lot_rent?: number;
    park_owned?: boolean;
    notes?: string;
  };
  onDescriptionGenerated?: (description: string) => void;
}

type DescriptionStyle = "professional" | "casual" | "detailed" | "brief";
type DescriptionPurpose = "listing" | "social" | "email";

export default function PropertyDescriptionGenerator({ 
  property, 
  onDescriptionGenerated 
}: PropertyDescriptionGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState<DescriptionStyle>("professional");
  const [purpose, setPurpose] = useState<DescriptionPurpose>("listing");
  const [copied, setCopied] = useState(false);

  const generateDescription = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-description", {
        body: {
          property,
          style,
          purpose,
        },
      });

      if (error) throw error;

      const generatedDescription = data.description || "";
      setDescription(generatedDescription);

      if (onDescriptionGenerated) {
        onDescriptionGenerated(generatedDescription);
      }

      toast({
        title: "Description Generated",
        description: "AI has created a property description for you.",
      });
    } catch (error) {
      console.error("Error generating description:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate description.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Description copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please select and copy manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Property Description
        </CardTitle>
        <CardDescription>
          Generate compelling descriptions for {property.address}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={style} onValueChange={(v) => setStyle(v as DescriptionStyle)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual & Friendly</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="brief">Brief & Punchy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Purpose</Label>
            <Select value={purpose} onValueChange={(v) => setPurpose(v as DescriptionPurpose)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="listing">Property Listing</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="email">Email to Buyers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={generateDescription}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Description
            </>
          )}
        </Button>

        {description && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Generated Description</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
