"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import axios from "axios";

import Toast from "@/components/ui/Toast";

interface FileUploaderProps {
  onUploadSuccess: (snapshots: any[]) => void;
  existingFilenames?: string[];
}

export default function FileUploader({ onUploadSuccess, existingFilenames = [] }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Strict Duplicate Validation
    const duplicates = files.filter(f => existingFilenames.includes(f.name));
    if (duplicates.length > 0) {
      setIsError(true);
      setToastMessage(`File already uploaded: ${duplicates[0].name}`);
      setTimeout(() => setToastMessage(""), 3000);
      e.target.value = "";
      return;
    }
    
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    setIsUploading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/upload", formData);
      onUploadSuccess(res.data);
      
      setIsError(false);
      setToastMessage(`${files.length} file(s) uploaded successfully!`);
      setTimeout(() => setToastMessage(""), 3000);
      
    } catch (error) {
      console.error(error);
      setIsError(true);
      setToastMessage("Upload failed. Please try again.");
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="w-full border-2 border-dashed border-zinc-700 hover:border-violet-500 transition-colors rounded-xl p-8 flex flex-col items-center justify-center bg-zinc-900 shadow-md relative group">
      <UploadCloud className="w-12 h-12 text-zinc-400 mb-3 group-hover:text-violet-400 transition-colors" />
      <p className="text-zinc-300 font-medium mb-1">Upload Data Sources</p>
      <p className="text-zinc-500 text-sm mb-4">Drag & drop or click to select CSV/Excel</p>
      
      <label className={`bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg cursor-pointer transition-colors shadow-lg shadow-violet-900/20 font-medium ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {isUploading ? "Uploading..." : "Browse Files"}
        <input type="file" multiple accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} disabled={isUploading} />
      </label>

      <Toast message={toastMessage} type={isError ? "error" : "success"} position="top" />
    </div>
  );
}
