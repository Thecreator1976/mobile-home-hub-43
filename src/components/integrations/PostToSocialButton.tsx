import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useIntegrations, useSocialPosts } from "@/hooks/useIntegrations";
import { Facebook, Instagram, Linkedin, Share2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SellerLead {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  state?: string | null;
  home_type?: string | null;
  asking_price: number;
  estimated_value?: number | null;
  condition?: number | null;
  width_ft?: number | null;
  length_ft?: number | null;
  year_built?: number | null;
}

interface PostToSocialButtonProps {
  lead: SellerLead;
}

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-600" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-600" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
];

export function PostToSocialButton({ lead }: PostToSocialButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["facebook"]);
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  
  const { integrations, triggerWebhook } = useIntegrations();
  const { createPost } = useSocialPosts();

  const generateDefaultContent = () => {
    const homeType = lead.home_type === "single" ? "Single Wide" : 
                     lead.home_type === "double" ? "Double Wide" : 
                     lead.home_type === "triple" ? "Triple Wide" : "Mobile Home";
    
    const size = lead.width_ft && lead.length_ft 
      ? `${lead.width_ft}x${lead.length_ft}` 
      : "";
    
    const price = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(lead.asking_price);

    const location = [lead.city, lead.state].filter(Boolean).join(", ");

    return `🏡 NEW MOBILE HOME LISTING!

${homeType} ${size ? `(${size})` : ""}
📍 ${lead.address}${location ? `, ${location}` : ""}

💰 Price: ${price}
${lead.year_built ? `📅 Year: ${lead.year_built}` : ""}
${lead.condition ? `⭐ Condition: ${lead.condition}/5` : ""}

Contact us for more details! 👇

#mobilehome #manufacturedhome #realestate #forsale #homesforsale`;
  };

  const handleOpen = () => {
    setContent(generateDefaultContent());
    setOpen(true);
  };

  const handlePost = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one platform",
        variant: "destructive",
      });
      return;
    }

    const facebookIntegration = integrations.find(
      i => i.service_name === "facebook_posting" && i.is_active
    );

    if (!facebookIntegration?.webhook_url) {
      toast({
        title: "No Integration Configured",
        description: "Please set up a Facebook posting integration first.",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);

    try {
      // Trigger webhook for each platform
      for (const platform of selectedPlatforms) {
        await triggerWebhook(facebookIntegration.webhook_url, {
          event: "new_listing",
          platform,
          content,
          lead: {
            id: lead.id,
            name: lead.name,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            home_type: lead.home_type,
            asking_price: lead.asking_price,
            estimated_value: lead.estimated_value,
            condition: lead.condition,
            width_ft: lead.width_ft,
            length_ft: lead.length_ft,
            year_built: lead.year_built,
          },
        });

        // Record the post in queue
        await createPost.mutateAsync({
          seller_lead_id: lead.id,
          platform,
          content,
          media_urls: [],
          scheduled_time: null,
          status: "pending",
          external_post_id: null,
          error_message: null,
        });
      }

      toast({
        title: "Posts Queued",
        description: `Sent to ${selectedPlatforms.length} platform(s). Check your Zapier history.`,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error posting:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <Share2 className="h-4 w-4 mr-2" />
        Post to Social
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post Listing to Social Media</DialogTitle>
            <DialogDescription>
              Share this listing on your connected social media accounts via Zapier
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Platforms</Label>
              <div className="flex gap-4">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <label
                      key={platform.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={() => togglePlatform(platform.id)}
                      />
                      <Icon className={`h-5 w-5 ${platform.color}`} />
                      <span className="text-sm">{platform.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Post Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Edit the content above before posting
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePost} disabled={isPosting}>
              {isPosting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Post to {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
