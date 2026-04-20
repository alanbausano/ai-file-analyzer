import { CheckCircle2, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  position?: "top" | "bottom-right";
}

export default function Toast({ message, type = "success", position = "top" }: ToastProps) {
  if (!message) return null;

  const isError = type === "error";
  
  const positionalClasses = position === "top" 
    ? "fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300"
    : "fixed bottom-6 right-6 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300";

  const styleClasses = isError
    ? "bg-red-500/10 border border-red-500/50 text-red-500 shadow-lg backdrop-blur-sm"
    : "bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 shadow-lg backdrop-blur-sm";

  const Icon = isError ? AlertCircle : CheckCircle2;
  const iconClasses = isError ? "text-red-500 mr-2 w-4 h-4" : "text-emerald-500 mr-2 w-4 h-4";

  return (
    <div className={`${positionalClasses}`}>
      <div className={`px-4 py-3 rounded-lg flex items-center ${styleClasses}`}>
        <Icon className={`${iconClasses}`} />
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
}
