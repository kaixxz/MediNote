import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import SoapBuilder from "@/components/SoapBuilder";

export default function Generator() {
  const [reportType, setReportType] = useState<"soap" | "progress" | "discharge">("soap");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-emerald-950">
      {/* Navigation */}
      <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="cursor-pointer group">
                <span className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-200">
                  Medinote
                </span>
              </div>
            </Link>
            
            <div className="flex items-center space-x-4">
              {/* Report Type Selector */}
              <Select value={reportType} onValueChange={(value: "soap" | "progress" | "discharge") => setReportType(value)}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="soap" className="text-white hover:bg-gray-700">SOAP Notes</SelectItem>
                  <SelectItem value="progress" className="text-white hover:bg-gray-700">Progress Notes</SelectItem>
                  <SelectItem value="discharge" className="text-white hover:bg-gray-700">Discharge Summary</SelectItem>
                </SelectContent>
              </Select>
              
              <Link href="/">
                <Button variant="outline" className="flex items-center space-x-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <SoapBuilder reportType={reportType} setReportType={setReportType} />
    </div>
  );
}