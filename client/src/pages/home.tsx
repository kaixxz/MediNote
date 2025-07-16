import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, ArrowDown, Play, Sparkles, FileText, Clock, CheckCircle, Zap, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GenerateReportRequest, GenerateReportResponse } from "@shared/schema";

export default function Home() {
  const [reportType, setReportType] = useState<string>("soap");
  const [patientNotes, setPatientNotes] = useState<string>("");
  const [generatedReport, setGeneratedReport] = useState<string>("");
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [demoText, setDemoText] = useState<string>("");
  const [showDemoOutput, setShowDemoOutput] = useState<boolean>(false);
  const { toast } = useToast();
  const inputSectionRef = useRef<HTMLDivElement>(null);

  // Demo typing effect - examples for different report types
  const demoExamples = {
    soap: {
      input: "Patient presents with acute chest pain radiating to left arm, onset 2 hours ago. Diaphoretic, anxious. History of hypertension, smoking. Vital signs: BP 160/95, HR 102, O2 sat 98%. ECG shows ST elevation in leads II, III, aVF.",
      output: `SUBJECTIVE:
Patient reports acute chest pain with radiation to the left arm, onset approximately 2 hours prior to presentation. Associated symptoms include diaphoresis and anxiety. Past medical history significant for hypertension and smoking.

OBJECTIVE:
Vital Signs: Blood pressure 160/95 mmHg, heart rate 102 bpm, oxygen saturation 98% on room air
Physical exam: Patient appears diaphoretic and anxious
ECG: ST elevation noted in leads II, III, aVF consistent with inferior wall MI

ASSESSMENT:
Acute ST-elevation myocardial infarction (STEMI) - inferior wall

PLAN:
1. Immediate cardiology consultation for emergent cardiac catheterization
2. Administer aspirin, clopidogrel, atorvastatin
3. Heparin per protocol
4. Serial cardiac enzymes and ECGs
5. Continuous cardiac monitoring
6. NPO pending procedure`
    },
    progress: {
      input: "Follow-up visit for diabetes management. Patient reports improved glucose control with current medications. Recent HbA1c 7.2%. No hypoglycemic episodes. Blood pressure stable. Eye exam scheduled next month.",
      output: `PATIENT STATUS:
66-year-old patient with Type 2 diabetes mellitus returning for routine follow-up. Patient reports feeling well with improved energy levels.

INTERVAL HISTORY:
Patient reports good adherence to metformin and glipizide regimen. Home glucose monitoring shows readings consistently 120-160 mg/dL. No episodes of hypoglycemia or hyperglycemia. Diet compliance good, regular exercise 3x weekly.

ASSESSMENT:
Type 2 diabetes mellitus - well controlled
Recent HbA1c 7.2% (improved from 8.1% three months ago)
Blood pressure stable at 128/82 mmHg

PLAN:
1. Continue current medications: metformin 1000mg BID, glipizide 5mg daily
2. Ophthalmology referral scheduled for diabetic retinal screening
3. Annual nephrology consultation recommended
4. Continue current lifestyle modifications
5. Follow-up in 3 months with repeat HbA1c
6. Patient counseled on hypoglycemia recognition`
    },
    discharge: {
      input: "72-year-old admitted for pneumonia, treated with antibiotics. Improved clinically, afebrile x48hrs. Discharge home with oral antibiotics. Follow-up with primary care in 1 week.",
      output: `ADMISSION INFORMATION:
Date of Admission: [Date]
Chief Complaint: Shortness of breath and productive cough
Admitting Diagnosis: Community-acquired pneumonia

HOSPITAL COURSE:
72-year-old patient admitted with 5-day history of productive cough, fever, and dyspnea. Chest X-ray revealed right lower lobe consolidation. Treated with IV ceftriaxone and azithromycin with marked clinical improvement. Patient became afebrile after 48 hours and oxygen requirements resolved.

DISCHARGE CONDITION:
Stable, afebrile, ambulating independently, oxygen saturation 96% on room air

DISCHARGE MEDICATIONS:
1. Amoxicillin-clavulanate 875mg PO BID x 5 days
2. Resume home medications as previously prescribed

FOLLOW-UP INSTRUCTIONS:
1. Primary care physician appointment in 1 week
2. Repeat chest X-ray in 4-6 weeks if symptoms persist
3. Return to ED if fever, worsening shortness of breath, or chest pain
4. Complete full course of antibiotics

DISCHARGE DIAGNOSIS:
Primary: Community-acquired pneumonia, resolved`
    }
  };
  
  const currentDemo = demoExamples.soap; // Default to SOAP for demo
  const demoInputText = currentDemo.input;
  const demoOutputText = currentDemo.output;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const startDemo = () => {
      setIsTyping(true);
      setDemoText("");
      setShowDemoOutput(false);
      
      // Typing effect
      let currentIndex = 0;
      const typeText = () => {
        if (currentIndex < demoInputText.length) {
          setDemoText(demoInputText.slice(0, currentIndex + 1));
          currentIndex++;
          timeout = setTimeout(typeText, 30);
        } else {
          // Show output after typing completes
          setTimeout(() => {
            setIsTyping(false);
            setShowDemoOutput(true);
          }, 1000);
        }
      };
      
      typeText();
    };

    // Start first demo immediately
    startDemo();
    
    // Restart demo every 15 seconds
    const interval = setInterval(startDemo, 15000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const scrollToInput = () => {
    inputSectionRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const smoothScrollTo = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateReportRequest): Promise<GenerateReportResponse> => {
      const res = await apiRequest("POST", "/api/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedReport(data.report);
      setShowResults(true);
      toast({
        title: "Report Generated",
        description: "Your SOAP note has been generated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!patientNotes.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter patient notes before generating a report.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      reportType,
      patientNotes: patientNotes.trim(),
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedReport);
      toast({
        title: "Copied!",
        description: "Report has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewReport = () => {
    setPatientNotes("");
    setGeneratedReport("");
    setShowResults(false);
  };

  const handleRegenerate = () => {
    if (patientNotes.trim()) {
      generateMutation.mutate({
        reportType,
        patientNotes: patientNotes.trim(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-tight">Noto</h1>
            <div className="hidden md:flex items-center space-x-8 text-gray-300">
              <button onClick={() => smoothScrollTo('features')} className="hover:text-white transition-all duration-300 hover:scale-105">Features</button>
              <button onClick={() => smoothScrollTo('use-cases')} className="hover:text-white transition-all duration-300 hover:scale-105">Use Cases</button>
              <button onClick={() => smoothScrollTo('pricing')} className="hover:text-white transition-all duration-300 hover:scale-105">Pricing</button>
              <button onClick={() => smoothScrollTo('enterprise')} className="hover:text-white transition-all duration-300 hover:scale-105">Enterprise</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 lg:px-8 pt-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Headline */}
          <div className="text-center lg:text-left space-y-8 animate-slide-in-left">
            
            <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                AI-powered medical reports
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                in seconds
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-400 max-w-xl">
              Just describe the case. We'll write the report. Transform clinical notes into structured documentation instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                onClick={scrollToInput}
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 px-8 py-4 text-lg rounded-2xl h-auto transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25 animate-pulse-glow"
              >
                Try It Now
              </Button>
            </div>
          </div>

          {/* Right: Animated Demo */}
          <div className="relative animate-slide-in-right">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-xl border border-gray-600/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-3xl"></div>
              <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl animate-float"></div>
              <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-teal-400/10 to-emerald-400/10 rounded-full blur-2xl animate-float" style={{animationDelay: '1s'}}></div>
              
              <div className="relative z-10">
                {/* Window controls */}
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  <div className="ml-4 text-xs text-gray-400 font-mono">noto.ai/dashboard</div>
                </div>
                
                {/* Demo Input */}
                <div className="mb-6">
                  <div className="text-xs text-gray-400 mb-2 font-medium tracking-wide">PATIENT NOTES</div>
                  <div className="bg-gray-800/70 border border-gray-600/50 rounded-2xl p-6 min-h-[140px] relative backdrop-blur-sm">
                    <div className="text-gray-100 leading-relaxed text-sm">
                      {demoText}
                      {isTyping && <span className="bg-emerald-400 text-emerald-400 animate-pulse">|</span>}
                    </div>
                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="absolute bottom-3 right-3 flex items-center space-x-1">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Demo Generate Button */}
                <Button 
                  className="w-full mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl py-3 text-sm font-semibold transition-all duration-300 transform hover:scale-[1.01] shadow-lg shadow-emerald-500/25"
                  disabled={isTyping}
                >
                  {isTyping ? (
                    <>
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Processing...
                      </div>
                    </>
                  ) : (
                    <>
                      Generate
                    </>
                  )}
                </Button>
                
                {/* Demo Output */}
                {showDemoOutput && (
                  <div className="bg-gray-800/70 border border-gray-600/50 rounded-2xl overflow-hidden animate-fade-in backdrop-blur-sm">
                    <div className="bg-gradient-to-r from-emerald-600/10 to-teal-600/10 px-6 py-4 border-b border-gray-600/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-300 font-medium tracking-wide">GENERATED SOAP NOTE</span>
                        </div>
                        <Button size="sm" variant="ghost" className="text-xs text-gray-400 hover:text-white transition-colors">
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="text-sm text-gray-200 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar whitespace-pre-line">
                        {demoOutputText}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            

          </div>
        </div>
      </section>

      {/* Input Section */}
      <section ref={inputSectionRef} className="py-20 px-6 lg:px-8 bg-gray-950/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Generate Your Report
            </h2>
            <p className="text-xl text-gray-400">
              Enter your patient notes and let AI create professional documentation
            </p>
          </div>

          {/* Generator Form */}
          <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl">
            <CardContent className="p-8 lg:p-10">
              {/* Report Type Selector */}
              <div className="mb-8">
                <Label htmlFor="reportType" className="text-lg font-medium text-gray-200 mb-4 block">
                  Report Type
                </Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-600 rounded-xl hover:bg-gray-700 text-white h-12 text-lg transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="soap">SOAP Note</SelectItem>
                    <SelectItem value="progress">Progress Note</SelectItem>
                    <SelectItem value="discharge">Discharge Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Input Textarea */}
              <div className="mb-8">
                <Label htmlFor="patientNotes" className="text-lg font-medium text-gray-200 mb-4 block">
                  Patient Notes
                </Label>
                <Textarea
                  id="patientNotes"
                  rows={10}
                  className="w-full bg-gray-800 border-gray-600 rounded-xl hover:bg-gray-700 focus:bg-gray-700 text-white placeholder-gray-400 resize-none text-lg leading-relaxed transition-all duration-200"
                  placeholder={
                    reportType === "soap" 
                      ? "Describe the patient case here. Include symptoms, vital signs, examination findings, medical history, and any other relevant clinical information. The AI will structure this into a professional SOAP note format."
                    : reportType === "progress"
                      ? "Provide updates on the patient's condition since the last visit. Include current symptoms, response to treatment, vital signs, physical examination findings, and any changes in status."
                      : "Describe the patient's entire hospital stay. Include admission reason, treatments received, procedures performed, current condition, medications, and discharge planning information."
                  }
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  maxLength={2000}
                />
                <div className="mt-3 flex justify-between items-center text-sm text-gray-400">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    AI processing typically takes 3-5 seconds
                  </span>
                  <span>{patientNotes.length}/2000</span>
                </div>
              </div>

              {/* Generate Button */}
              <div className="mb-6 relative">
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-700 text-white font-semibold py-5 px-6 rounded-xl h-auto text-lg transition-all duration-300 transform hover:scale-[1.01] shadow-xl shadow-emerald-900/40 hover:shadow-emerald-900/60 border border-emerald-600/40"
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-emerald-400/10 rounded-xl animate-shimmer"></div>
                  
                  {/* Button content */}
                  <div className="relative z-10 flex items-center justify-center">
                    {generateMutation.isPending ? (
                      <>
                        <div className="relative mr-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <div className="absolute inset-0 w-5 h-5 border-2 border-transparent border-t-emerald-200 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '0.8s'}}></div>
                        </div>
                        <span className="font-semibold">Processing Clinical Data...</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">Generate</span>
                      </>
                    )}
                  </div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600/0 via-white/5 to-emerald-600/0 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </div>

              {/* Results Section */}
              {showResults && (
                <div className="animate-fade-in">
                  <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/60 backdrop-blur-xl border border-gray-600/50 rounded-3xl overflow-hidden shadow-2xl relative">
                    {/* Animated background elements */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-3xl"></div>
                    <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-2xl animate-float"></div>
                    
                    {/* Header */}
                    <div className="relative z-10 bg-gradient-to-r from-green-600/15 via-blue-600/15 to-purple-600/15 p-8 border-b border-gray-600/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-1">Generated SOAP Note</h3>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-sm text-gray-300 font-medium">Professional Medical Documentation</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={handleCopy}
                          className="bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white border border-emerald-600/40 px-5 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-8">
                      <div className="bg-gray-800/50 border border-gray-600/30 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="text-gray-100 leading-relaxed text-lg whitespace-pre-wrap font-mono tracking-wide">
                          {generatedReport}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleRegenerate}
                      disabled={generateMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border border-slate-600/40 py-3 px-5 rounded-xl transition-all duration-300 transform hover:scale-[1.01] shadow-lg relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 mr-2" />
                        <span className="font-medium">Regenerate</span>
                      </div>
                    </Button>
                    <Button
                      onClick={handleNewReport}
                      className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border border-slate-600/40 py-3 px-5 rounded-xl transition-all duration-300 transform hover:scale-[1.01] shadow-lg relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-600/10 to-emerald-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex items-center justify-center">
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="font-medium">New Report</span>
                      </div>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 animate-slide-up">
              Why Healthcare Professionals Choose Noto
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
              Save hours of documentation time while maintaining the highest standards of medical reporting
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-8 text-center hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20 animate-fade-in">
              <h3 className="text-xl font-semibold text-white mb-4">Clinically Accurate</h3>
              <p className="text-gray-400 leading-relaxed">
                AI trained on medical literature ensures consistent, professional documentation that meets clinical standards.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-8 text-center hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <h3 className="text-xl font-semibold text-white mb-4">Lightning Fast</h3>
              <p className="text-gray-400 leading-relaxed">
                Transform unstructured notes into professional SOAP reports in under 5 seconds. Focus on patients, not paperwork.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-8 text-center hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <h3 className="text-xl font-semibold text-white mb-4">HIPAA Compliant</h3>
              <p className="text-gray-400 leading-relaxed">
                Enterprise-grade security ensures patient data privacy and regulatory compliance at every step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 px-6 lg:px-8 bg-gray-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 animate-slide-up">
              Built for Every Healthcare Setting
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
              From emergency departments to private practice, Noto adapts to your workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20">
              <h3 className="text-lg font-semibold text-white mb-3">Emergency Medicine</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Rapid documentation for high-volume patient encounters. Generate comprehensive SOAP notes in seconds during critical situations.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20">
              <h3 className="text-lg font-semibold text-white mb-3">Primary Care</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Streamline routine visits and follow-ups. Consistent documentation for patient continuity and quality care.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20">
              <h3 className="text-lg font-semibold text-white mb-3">Specialty Practice</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Specialized templates for cardiology, neurology, psychiatry, and other specialties. Tailored to clinical workflows.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20">
              <h3 className="text-lg font-semibold text-white mb-3">Telemedicine</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Perfect for virtual consultations. Generate professional documentation for remote patient encounters.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20">
              <h3 className="text-lg font-semibold text-white mb-3">Hospital Systems</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Enterprise integration with existing EMR systems. Scalable solution for large healthcare organizations.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20">
              <h3 className="text-lg font-semibold text-white mb-3">Urgent Care</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Fast-paced environment support. Efficient documentation for walk-in patients and minor emergencies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 animate-slide-up">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
              Choose the plan that fits your practice. All plans include unlimited SOAP notes and 24/7 support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 animate-fade-in">
            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-8 hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20">
              <h3 className="text-xl font-semibold text-white mb-2">Starter</h3>
              <div className="text-3xl font-bold text-white mb-1">$29<span className="text-lg text-gray-400">/month</span></div>
              <p className="text-gray-400 mb-6">Perfect for individual practitioners</p>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li>• Up to 100 reports/month</li>
                <li>• SOAP Note generation</li>
                <li>• Email support</li>
                <li>• Basic templates</li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">Get Started</Button>
            </div>

            <div className="bg-gradient-to-b from-emerald-900/20 to-teal-900/20 border-2 border-emerald-500/50 rounded-2xl p-8 relative hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 rounded-full text-sm">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Professional</h3>
              <div className="text-3xl font-bold text-white mb-1">$79<span className="text-lg text-gray-400">/month</span></div>
              <p className="text-gray-400 mb-6">For busy practices and clinics</p>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li>• Unlimited reports</li>
                <li>• All report types</li>
                <li>• Priority support</li>
                <li>• Custom templates</li>
                <li>• EMR integration</li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">Start Free Trial</Button>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-8 hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20">
              <h3 className="text-xl font-semibold text-white mb-2">Enterprise</h3>
              <div className="text-3xl font-bold text-white mb-1">Custom</div>
              <p className="text-gray-400 mb-6">For large healthcare systems</p>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li>• Unlimited everything</li>
                <li>• Custom integrations</li>
                <li>• Dedicated support</li>
                <li>• On-premise deployment</li>
                <li>• Training & onboarding</li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section id="enterprise" className="py-20 px-6 lg:px-8 bg-gray-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 animate-slide-up">
              Enterprise Ready
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
              Scalable AI documentation solution built for healthcare organizations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center animate-fade-in">
            <div className="space-y-8 animate-slide-up">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Enterprise Security</h3>
                <p className="text-gray-400 leading-relaxed">
                  SOC 2 Type II compliance, end-to-end encryption, and audit trails ensure your patient data stays secure and compliant.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Seamless Integration</h3>
                <p className="text-gray-400 leading-relaxed">
                  Connect with Epic, Cerner, Allscripts, and other major EMR systems. API-first architecture for custom workflows.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Dedicated Support</h3>
                <p className="text-gray-400 leading-relaxed">
                  24/7 technical support, dedicated customer success manager, and comprehensive training for your entire organization.
                </p>
              </div>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-8 hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <h3 className="text-xl font-semibold text-white mb-6">Ready to Transform Your Documentation?</h3>
              <div className="space-y-4">
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Custom deployment options</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Volume pricing available</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Implementation support</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Ongoing training programs</span>
                </div>
              </div>
              <Button className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 bg-black/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center space-x-3">
              <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-tight">Noto</h3>
            </div>
            
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Transforming healthcare documentation with AI. Professional medical reports in seconds.
            </p>
            
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            
            <div className="text-gray-500 text-sm pt-8 border-t border-gray-800">
              © 2024 Noto. All rights reserved. Professional medical documentation made simple.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
