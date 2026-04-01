import { useState, useCallback, useRef } from "react";
import { Upload, X, File, Image, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface FileUploadProps {
  bucket: string;
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  onUploadComplete?: (url: string, path: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function FileUpload({
  bucket,
  folder = "",
  accept = "image/*,application/pdf",
  maxSize = 10,
  onUploadComplete,
  onError,
  className,
}: FileUploadProps) {
  const { userOrganization } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, [uploadFile]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Upload Error",
        description: validationError,
        variant: "destructive",
      });
      onError?.(new Error(validationError));
      return;
    }

    // Require organization context for secure uploads
    if (!userOrganization?.id) {
      toast({
        title: "Upload Error",
        description: "Organization context required for uploads",
        variant: "destructive",
      });
      onError?.(new Error("Organization context required"));
      return;
    }

    setStatus("uploading");
    setFileName(file.name);
    setProgress(0);

    try {
      const fileExt = file.name.split(".").pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      // Use organization-scoped path for storage RLS policies
      const orgFolder = userOrganization.id;
      const subFolder = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
      const filePath = `${orgFolder}/${subFolder}`;

      // Simulate progress (Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) throw error;

      setProgress(100);
      setStatus("success");

      // Use signed URL for private buckets instead of public URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(data.path, 3600); // 1 hour expiry

      if (signedUrlError) throw signedUrlError;

      onUploadComplete?.(signedUrlData.signedUrl, data.path);

      toast({
        title: "Upload Complete",
        description: "File uploaded successfully.",
      });
    } catch (error) {
      setStatus("error");
      const err = error instanceof Error ? error : new Error("Upload failed");
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
      onError?.(err);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        uploadFile(file);
      }
    },
    [bucket, folder, maxSize, onUploadComplete, onError]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const reset = () => {
    setStatus("idle");
    setProgress(0);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-8 w-8 text-status-closed" />;
      case "error":
        return <AlertCircle className="h-8 w-8 text-destructive" />;
      case "uploading":
        return <File className="h-8 w-8 text-primary animate-pulse" />;
      default:
        return <Upload className="h-8 w-8 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => status === "idle" && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer",
          "flex flex-col items-center justify-center gap-3",
          isDragging && "border-primary bg-primary/5",
          status === "idle" && "border-border hover:border-primary/50 hover:bg-muted/50",
          status === "success" && "border-status-closed bg-status-closed/5",
          status === "error" && "border-destructive bg-destructive/5",
          status === "uploading" && "border-primary bg-primary/5 cursor-wait"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={status === "uploading"}
        />

        {getStatusIcon()}

        {status === "idle" && (
          <>
            <div className="text-center">
              <p className="text-sm font-medium">
                Drag and drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max file size: {maxSize}MB
              </p>
            </div>
          </>
        )}

        {status === "uploading" && (
          <div className="w-full max-w-xs space-y-2">
            <p className="text-sm text-center truncate">{fileName}</p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {progress}% uploaded
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <p className="text-sm font-medium text-status-closed">
              Upload complete!
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {fileName}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <p className="text-sm font-medium text-destructive">
              Upload failed
            </p>
            <p className="text-xs text-muted-foreground">
              Please try again
            </p>
          </div>
        )}
      </div>

      {(status === "success" || status === "error") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="mt-2 w-full"
        >
          <X className="h-4 w-4 mr-2" />
          {status === "success" ? "Upload Another" : "Try Again"}
        </Button>
      )}
    </div>
  );
}
