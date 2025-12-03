import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Image, File, X } from "lucide-react";

interface DocumentsData {
  photos: string[];
  files: string[];
}

interface DocumentsFormProps {
  data: DocumentsData;
  onChange: (field: string, value: string[]) => void;
}

export default function DocumentsForm({ data, onChange }: DocumentsFormProps) {
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // For now, just show a placeholder message
    // In production, you would upload to Supabase Storage
    setUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      setUploading(false);
    }, 1000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setUploading(true);
    
    setTimeout(() => {
      setUploading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Photos Section */}
      <div className="space-y-4">
        <Label>Property Photos</Label>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
              <Image className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop photos here, or click to browse
              </p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <Button asChild variant="outline" disabled={uploading}>
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Photos"}
                </label>
              </Button>
            </div>
            
            {data.photos.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {data.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Property photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onChange("photos", data.photos.filter((_, i) => i !== index))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents Section */}
      <div className="space-y-4">
        <Label>Documents</Label>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
              <File className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload title documents, inspection reports, or other files
              </p>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button asChild variant="outline" disabled={uploading}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Documents"}
                </label>
              </Button>
            </div>

            {data.files.length > 0 && (
              <div className="mt-4 space-y-2">
                {data.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center">
                      <File className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{file}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onChange("files", data.files.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Note: File uploads will be available after the lead is created. You can add documents from the lead detail page.
      </p>
    </div>
  );
}
