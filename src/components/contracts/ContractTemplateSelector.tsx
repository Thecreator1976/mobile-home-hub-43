import { useState } from "react";
import { useContractTemplates, ContractTemplate } from "@/hooks/useContractTemplates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Eye, FileText, Loader2 } from "lucide-react";

interface ContractTemplateSelectorProps {
  selectedTemplateId: string | null;
  onTemplateSelect: (template: ContractTemplate | null) => void;
}

export function ContractTemplateSelector({
  selectedTemplateId,
  onTemplateSelect,
}: ContractTemplateSelectorProps) {
  const { templates, isLoading } = useContractTemplates();
  const [previewOpen, setPreviewOpen] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleValueChange = (value: string) => {
    if (value === "none") {
      onTemplateSelect(null);
    } else {
      const template = templates.find((t) => t.id === value);
      onTemplateSelect(template || null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading templates...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label>Contract Template</Label>
      <div className="flex gap-2">
        <Select value={selectedTemplateId || "none"} onValueChange={handleValueChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a template..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Generate from scratch (no template)
              </div>
            </SelectItem>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex flex-col items-start">
                  <span>{template.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {template.category}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTemplate && (
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" title="Preview template">
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] mt-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {selectedTemplate.content}
                  </pre>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {selectedTemplate && (
        <p className="text-sm text-muted-foreground">
          {selectedTemplate.description || `Using "${selectedTemplate.name}" as base template`}
        </p>
      )}

      {templates.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          No templates found. Create templates in the Contract Templates page first, or generate from scratch.
        </p>
      )}
    </div>
  );
}
