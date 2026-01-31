import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Image, File, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface DocumentsData {
  photos: string[];
  files: string[];
}

interface DocumentsFormProps {
  data: DocumentsData;
  onChange: (field: string, value: string[]) => void;
}

export default function DocumentsForm({ data, onChange }: DocumentsFormProps) {
  const { userOrganization } = useAuth();
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const uploadToStorage = async (file: globalThis.File, folder: string): Promise<{ url: string; path: string } | null> => {
    // Require organization context for secure uploads
    if (!userOrganization?.id) {
      console.error("Organization context required for uploads");
      return null;
    }

    const fileExt = file.name.split(".").pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    // Use organization-scoped path for storage RLS policies
    const filePath = `${userOrganization.id}/${folder}/${uniqueFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    // Get signed URL for private bucket
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("documents")
      .createSignedUrl(uploadData.path, 86400); // 24 hour expiry

    if (signedUrlError) {
      console.error("Signed URL error:", signedUrlError);
      return null;
    }

    return { url: signedUrlData.signedUrl, path: uploadData.path };
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploadingPhotos(true);
    const uploadedUrls: string[] = [...data.photos];
    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(fileList)) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        errorCount++;
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        errorCount++;
        continue;
      }

      const result = await uploadToStorage(file, "photos");
      if (result) {
        uploadedUrls.push(result.url);
        successCount++;
      } else {
        errorCount++;
      }
    }

    onChange("photos", uploadedUrls);
    setUploadingPhotos(false);

    if (successCount > 0) {
      toast({
        title: "Photos Uploaded",
        description: `${successCount} photo(s) uploaded successfully.`,
      });
    }
    if (errorCount > 0) {
      toast({
        title: "Some uploads failed",
        description: `${errorCount} file(s) could not be uploaded.`,
        variant: "destructive",
      });
    }

    // Reset input
    e.target.value = "";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploadingFiles(true);
    const uploadedFiles: string[] = [...data.files];
    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(fileList)) {
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        errorCount++;
        continue;
      }

      const result = await uploadToStorage(file, "files");
      if (result) {
        // Store path for files (to display file name later)
        uploadedFiles.push(result.path);
        successCount++;
      } else {
        errorCount++;
      }
    }

    onChange("files", uploadedFiles);
    setUploadingFiles(false);

    if (successCount > 0) {
      toast({
        title: "Documents Uploaded",
        description: `${successCount} document(s) uploaded successfully.`,
      });
    }
    if (errorCount > 0) {
      toast({
        title: "Some uploads failed",
        description: `${errorCount} file(s) could not be uploaded.`,
        variant: "destructive",
      });
    }

    // Reset input
    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    onChange("photos", data.photos.filter((_, i) => i !== index));
  };

  const handleRemoveFile = (index: number) => {
    onChange("files", data.files.filter((_, i) => i !== index));
  };

  const getFileName = (path: string) => {
    const parts = path.split("/");
    return parts[parts.length - 1];
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
                disabled={uploadingPhotos}
              />
              <Button asChild variant="outline" disabled={uploadingPhotos}>
                <label htmlFor="photo-upload" className="cursor-pointer">
                  {uploadingPhotos ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photos
                    </>
                  )}
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
                      onClick={() => handleRemovePhoto(index)}
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
                disabled={uploadingFiles}
              />
              <Button asChild variant="outline" disabled={uploadingFiles}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  {uploadingFiles ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Documents
                    </>
                  )}
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
                      <span className="text-sm">{getFileName(file)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveFile(index)}
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
    </div>
  );
}
