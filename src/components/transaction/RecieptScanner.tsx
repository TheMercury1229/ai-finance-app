"use client";
import { Input } from "@/components/ui/input";
import useFetch from "@/hooks/useFetch";
import { scanReciept } from "@/actions/transactions";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
interface RecieptScannerProps {
  onScanComplete: (data: any) => void;
}
const RecieptScanner: React.FC<RecieptScannerProps> = ({ onScanComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    loading: isLoading,
    fn: scanFn,
    data: scanRes,
    error,
  } = useFetch(scanReciept);
  const handleRecieptChange = async (file: File) => {
    if(file.size>10*1024*1024){
      toast.error("File size should be less than 10MB");
      return;
    }
    await scanFn(file);
  };
  useEffect(() => {
    if (scanRes&&!isLoading) {
      onScanComplete(scanRes);
      toast.success("Reciept Scanned Successfully");
    }
  },[scanRes,isLoading]);
  return (
    <div>
      <Input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleRecieptChange(file);
        }}
        accept="image/*"
        capture="environment"
      />
      <Button
        className="w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        type="button"
        onClick={() => {
          fileInputRef.current?.click();
        }}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            Scanning Receipt...
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            <span>Scan Reciept with AI</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default RecieptScanner;
