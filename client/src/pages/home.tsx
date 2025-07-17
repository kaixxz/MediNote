import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, FileText, Clock, CheckCircle, Zap, Shield, ChevronRight } from "lucide-react";

export default function Home() {
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [demoText, setDemoText] = useState<string>("");
  const [showDemoOutput, setShowDemoOutput] = useState<boolean>(false);

  // Demo SOAP note example
  const demoExample = {
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
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const startDemo = () => {
      setIsTyping(true);
      setDemoText("");
      setShowDemoOutput(false);
      
      // Typing effect
      let currentIndex = 0;
      const typeText = () => {
        if (currentIndex < demoExample.input.length) {
          setDemoText(demoExample.input.slice(0, currentIndex + 1));
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

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-gray-950 to-emerald-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
        <div className="absolute top-32 right-20 w-96 h-96 bg-teal-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 p-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-200">
                Medinote
              </span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex items-center min-h-[80vh] px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left animate-fade-in">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered Medical Documentation
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  Build Professional
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent block">
                    Medical Reports
                  </span>
                  with AI
                </h1>
                
                <p className="text-xl lg:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Create SOAP notes, progress reports, and discharge summaries with intelligent, structured workflows that save hours while maintaining the highest standards of medical documentation.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 justify-center lg:justify-start mb-12">
                <Link href="/soap">
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-4 text-lg font-semibold rounded-xl shadow-2xl shadow-emerald-900/50 hover:shadow-emerald-900/70 transition-all duration-300 transform hover:scale-105 border border-emerald-500/30">
                    <FileText className="w-5 h-5 mr-2" />
                    SOAP Notes
                  </Button>
                </Link>
                
                <Link href="/progress">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-4 text-lg font-semibold rounded-xl shadow-2xl shadow-blue-900/50 hover:shadow-blue-900/70 transition-all duration-300 transform hover:scale-105 border border-blue-500/30">
                    <Clock className="w-5 h-5 mr-2" />
                    Progress Notes
                  </Button>
                </Link>
                
                <Link href="/discharge">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-4 text-lg font-semibold rounded-xl shadow-2xl shadow-purple-900/50 hover:shadow-purple-900/70 transition-all duration-300 transform hover:scale-105 border border-purple-500/30">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Discharge Summary
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:border-gray-500"
                >
                  Learn More
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 text-center lg:text-left">
                <div>
                  <div className="text-3xl font-bold text-emerald-400 mb-2">10x</div>
                  <div className="text-gray-400">Faster Documentation</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-400 mb-2">99%</div>
                  <div className="text-gray-400">Clinical Accuracy</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-400 mb-2">24/7</div>
                  <div className="text-gray-400">AI Assistant</div>
                </div>
              </div>
            </div>

            {/* Right Content - Demo */}
            <div className="relative animate-slide-up">
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-xl border border-gray-600/30 rounded-3xl overflow-hidden shadow-2xl">
                {/* Demo Header */}
                <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-gray-600/30 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Live SOAP Generation</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-300">Real-time AI processing</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demo Content */}
                <div className="p-6 space-y-6">
                  {/* Input Section */}
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-300">Input</span>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-4 min-h-[120px] relative">
                      <div className="text-gray-200 text-sm leading-relaxed font-mono">
                        {demoText}
                        {isTyping && (
                          <span className="inline-block w-1 bg-emerald-400 animate-blink ml-1">|</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Processing */}
                  {demoText && !showDemoOutput && (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center space-x-3 text-emerald-400">
                        <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">AI analyzing clinical data...</span>
                      </div>
                    </div>
                  )}

                  {/* Output Section */}
                  {showDemoOutput && (
                    <div className="animate-fade-in">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-300">Generated SOAP Note</span>
                      </div>
                      <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-4 max-h-80 overflow-y-auto">
                        <div className="text-gray-200 text-sm leading-relaxed font-mono whitespace-pre-wrap">
                          {demoExample.output}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-float"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Why Healthcare Professionals Choose Medinote
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Save hours of documentation time while maintaining the highest standards of medical reporting
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-600/50 backdrop-blur-sm hover:border-emerald-500/50 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Section-by-Section AI</h3>
                <p className="text-gray-400 leading-relaxed">
                  Generate each SOAP section individually with contextual AI that understands medical workflows and patient information.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-600/50 backdrop-blur-sm hover:border-teal-500/50 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">AI Review & Suggestions</h3>
                <p className="text-gray-400 leading-relaxed">
                  Get intelligent feedback on your documentation with suggestions for stronger clinical phrasing and completeness.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-600/50 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Smart Input Assistant</h3>
                <p className="text-gray-400 leading-relaxed">
                  Structured patient information forms with symptom checklists and system selectors to enhance AI generation.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold text-white mb-8">Choose Your Report Type</h3>
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link href="/soap">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-2xl shadow-emerald-900/50 hover:shadow-emerald-900/70 transition-all duration-300 transform hover:scale-105 border border-emerald-500/30">
                  <FileText className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-bold">SOAP Notes</div>
                    <div className="text-sm opacity-90">Structured clinical documentation</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/progress">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-2xl shadow-blue-900/50 hover:shadow-blue-900/70 transition-all duration-300 transform hover:scale-105 border border-blue-500/30">
                  <Clock className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-bold">Progress Notes</div>
                    <div className="text-sm opacity-90">Patient follow-up documentation</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/discharge">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-2xl shadow-purple-900/50 hover:shadow-purple-900/70 transition-all duration-300 transform hover:scale-105 border border-purple-500/30">
                  <CheckCircle className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-bold">Discharge Summary</div>
                    <div className="text-sm opacity-90">Hospital discharge documentation</div>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}