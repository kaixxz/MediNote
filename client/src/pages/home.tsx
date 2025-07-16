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

  // Demo typing effect
  const demoInputText = "Patient presents with acute chest pain radiating to left arm, onset 2 hours ago. Diaphoretic, anxious. History of hypertension, smoking. Vital signs: BP 160/95, HR 102, O2 sat 98%. ECG shows ST elevation in leads II, III, aVF.";
  
  const demoOutputText = `SUBJECTIVE:
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
6. NPO pending procedure`;

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
            <h1 className="text-2xl font-bold text-white">Noto</h1>
            <div className="hidden md:flex items-center space-x-8 text-gray-300">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#use-cases" className="hover:text-white transition-colors">Use Cases</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#enterprise" className="hover:text-white transition-colors">Enterprise</a>
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
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-4 text-lg rounded-2xl h-auto transition-all duration-300 transform hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2" />
                Try It Now
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-4 text-lg rounded-2xl h-auto transition-all duration-300"
              >
                <FileText className="w-5 h-5 mr-2" />
                View Demo
              </Button>
            </div>
          </div>

          {/* Right: Animated Demo */}
          <div className="relative animate-slide-in-right">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl animate-glow">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              
              {/* Demo Input */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Patient Notes</label>
                <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 min-h-[120px] relative">
                  <div className="text-gray-200 leading-relaxed">
                    {demoText}
                    {isTyping && <span className="animate-pulse">|</span>}
                  </div>
                </div>
              </div>
              
              {/* Demo Generate Button */}
              <Button 
                className="w-full mb-4 bg-blue-600 hover:bg-blue-700 rounded-xl"
                disabled={isTyping}
              >
                {isTyping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Generate SOAP Note"
                )}
              </Button>
              
              {/* Demo Output */}
              {showDemoOutput && (
                <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Generated SOAP Note</span>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
                    {demoOutputText}
                  </div>
                </div>
              )}
            </div>
            
            {/* Scroll Indicator */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 animate-bounce">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={scrollToInput}
                className="text-gray-500 hover:text-gray-300"
              >
                <ArrowDown className="w-5 h-5" />
              </Button>
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
                    <SelectItem value="progress" disabled>
                      Progress Note (Coming Soon)
                    </SelectItem>
                    <SelectItem value="discharge" disabled>
                      Discharge Summary (Coming Soon)
                    </SelectItem>
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
                  placeholder="Describe the patient case here. Include symptoms, vital signs, examination findings, medical history, and any other relevant clinical information. The AI will structure this into a professional SOAP note format."
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
              <div className="mb-8">
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 px-8 rounded-xl h-auto text-lg transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Generating Professional Report...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-6 w-6" />
                      Generate SOAP Note
                    </>
                  )}
                </Button>
              </div>

              {/* Results Section */}
              {showResults && (
                <div className="animate-fade-in">
                  <Card className="bg-gray-800/80 border border-gray-600 rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-6 border-b border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">Generated SOAP Note</h3>
                          </div>
                          <Button
                            onClick={handleCopy}
                            variant="outline"
                            size="sm"
                            className="bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white border-gray-600 transition-all duration-200"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Report
                          </Button>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="text-gray-100 leading-relaxed text-lg whitespace-pre-wrap">
                          {generatedReport}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Results Actions */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleRegenerate}
                      variant="outline"
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white border-gray-600 py-3 rounded-xl transition-all duration-200"
                      disabled={generateMutation.isPending}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={handleNewReport}
                      variant="outline"
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white border-gray-600 py-3 rounded-xl transition-all duration-200"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      New Report
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
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Why Healthcare Professionals Choose Noto
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Save hours of documentation time while maintaining the highest standards of medical reporting
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-8 text-center hover:bg-gray-800/50 transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-4">Clinically Accurate</h3>
              <p className="text-gray-400 leading-relaxed">
                AI trained on medical literature ensures consistent, professional documentation that meets clinical standards.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-8 text-center hover:bg-gray-800/50 transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-4">Lightning Fast</h3>
              <p className="text-gray-400 leading-relaxed">
                Transform unstructured notes into professional SOAP reports in under 5 seconds. Focus on patients, not paperwork.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-8 text-center hover:bg-gray-800/50 transition-all duration-300">
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
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Built for Every Healthcare Setting
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              From emergency departments to private practice, Noto adapts to your workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Emergency Medicine</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Rapid documentation for high-volume patient encounters. Generate comprehensive SOAP notes in seconds during critical situations.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Primary Care</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Streamline routine visits and follow-ups. Consistent documentation for patient continuity and quality care.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Specialty Practice</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Specialized templates for cardiology, neurology, psychiatry, and other specialties. Tailored to clinical workflows.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Telemedicine</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Perfect for virtual consultations. Generate professional documentation for remote patient encounters.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Hospital Systems</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Enterprise integration with existing EMR systems. Scalable solution for large healthcare organizations.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-6">
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
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Choose the plan that fits your practice. All plans include unlimited SOAP notes and 24/7 support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-white mb-2">Starter</h3>
              <div className="text-3xl font-bold text-white mb-1">$29<span className="text-lg text-gray-400">/month</span></div>
              <p className="text-gray-400 mb-6">Perfect for individual practitioners</p>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li>• Up to 100 reports/month</li>
                <li>• SOAP Note generation</li>
                <li>• Email support</li>
                <li>• Basic templates</li>
              </ul>
              <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-xl">Get Started</Button>
            </div>

            <div className="bg-gradient-to-b from-blue-900/20 to-purple-900/20 border-2 border-blue-500/50 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm">
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
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl">Start Free Trial</Button>
            </div>

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-8">
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
              <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-xl">Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section id="enterprise" className="py-20 px-6 lg:px-8 bg-gray-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Enterprise Ready
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Scalable AI documentation solution built for healthcare organizations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
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

            <div className="bg-gray-900/30 border border-gray-700 rounded-2xl p-8">
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
              <Button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl">
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Noto</h3>
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
