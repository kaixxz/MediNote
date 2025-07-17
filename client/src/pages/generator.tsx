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
            
            {/* Enhanced Report Type Tabs */}
            <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-2xl p-2 border border-gray-700/50">
              <button
                onClick={() => setReportType("soap")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  reportType === "soap"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/50"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                SOAP Notes
              </button>
              <button
                onClick={() => setReportType("progress")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  reportType === "progress"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                Progress Notes
              </button>
              <button
                onClick={() => setReportType("discharge")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  reportType === "discharge"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/50"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                Discharge Summary
              </button>
            </div>
          </div>
        </div>
      </nav>

      <SoapBuilder reportType={reportType} setReportType={setReportType} />
    </div>
  );
}