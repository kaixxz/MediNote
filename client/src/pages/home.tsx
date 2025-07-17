import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, FileText, Clock, CheckCircle, Zap, Shield, ChevronRight, User } from "lucide-react";

export default function Home() {
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [demoText, setDemoText] = useState<string>("");
  const [showDemoOutput, setShowDemoOutput] = useState<boolean>(false);
  const [currentDemoIndex, setCurrentDemoIndex] = useState<number>(0);

  // Demo examples for all three document types
  const demoExamples = [
    {
      type: "SOAP Note",
      color: "emerald",
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
    {
      type: "Progress Note",
      color: "blue",
      input: "Patient Day 3 post-operative coronary artery bypass surgery. Patient reports mild incisional pain 4/10. Ambulating with assistance. Chest tubes removed yesterday. Diet advanced to regular.",
      output: `PROGRESS NOTE - Post-Op Day 3

CURRENT STATUS:
Patient is 3 days post-operative following coronary artery bypass surgery. Overall condition stable with expected recovery trajectory.

SUBJECTIVE:
Patient reports mild incisional pain rated 4/10, well-controlled with current pain management. Tolerating regular diet without nausea or vomiting. Sleep quality improved from previous day.

OBJECTIVE:
- Vital Signs: Stable, afebrile
- Cardiac: Regular rate and rhythm, no murmurs
- Pulmonary: Clear to auscultation bilaterally, chest tubes discontinued
- Incision: Clean, dry, intact with no signs of infection
- Mobility: Ambulating with assistance, good effort

ASSESSMENT & PLAN:
1. Post-operative recovery proceeding as expected
2. Continue current pain management regimen
3. Advance activity as tolerated with physical therapy
4. Monitor for signs of complications
5. Target discharge in 2-3 days if progress continues`
    },
    {
      type: "Discharge Summary",
      color: "purple",
      input: "72-year-old male admitted for acute myocardial infarction. Underwent emergency cardiac catheterization with stent placement. Hospital course uncomplicated. Patient stable for discharge home.",
      output: `DISCHARGE SUMMARY

PATIENT: 72-year-old male
ADMISSION DATE: [Date]
DISCHARGE DATE: [Date]
LENGTH OF STAY: 4 days

PRINCIPAL DIAGNOSIS: Acute ST-elevation myocardial infarction

PROCEDURES PERFORMED:
- Emergency cardiac catheterization
- Percutaneous coronary intervention with drug-eluting stent placement to RCA

HOSPITAL COURSE:
Patient presented with acute chest pain and was found to have STEMI. Emergency cardiac catheterization revealed 99% occlusion of the right coronary artery, successfully treated with stent placement. Recovery was uncomplicated.

DISCHARGE MEDICATIONS:
1. Aspirin 81mg daily
2. Clopidogrel 75mg daily
3. Atorvastatin 80mg daily
4. Metoprolol 25mg twice daily

FOLLOW-UP:
- Cardiology in 1 week
- Primary care in 2 weeks
- Cardiac rehabilitation enrollment

DISCHARGE CONDITION: Stable`
    }
  ];

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const startDemo = () => {
      setIsTyping(true);
      setDemoText("");
      setShowDemoOutput(false);
      
      const currentDemo = demoExamples[currentDemoIndex];
      
      // Typing effect
      let currentIndex = 0;
      const typeText = () => {
        if (currentIndex < currentDemo.input.length) {
          setDemoText(currentDemo.input.slice(0, currentIndex + 1));
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
    
    // Restart demo every 15 seconds and cycle through examples
    const interval = setInterval(() => {
      setCurrentDemoIndex((prev) => (prev + 1) % demoExamples.length);
      startDemo();
    }, 15000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [currentDemoIndex]);

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
            <div className="cursor-pointer group">
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
              <div className="mb-12">
                <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  The Future of
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent block">
                    Medical Documentation
                  </span>
                  is Here
                </h1>
                
                <p className="text-xl lg:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Transform clinical workflows with AI that understands medicine. Generate SOAP notes, progress reports, and discharge summaries in seconds, not hours.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-16">
                <Link href="/soap">
                  <Button 
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-12 py-4 text-xl font-semibold rounded-2xl shadow-2xl shadow-emerald-900/50 hover:shadow-emerald-900/70 transition-all duration-500 transform hover:scale-105 border border-emerald-500/30 relative overflow-hidden group"
                    onClick={() => {
                      // Add page transition animation
                      document.body.style.transform = 'translateY(20px)';
                      document.body.style.opacity = '0.8';
                      document.body.style.transition = 'all 0.3s ease-out';
                      setTimeout(() => {
                        document.body.style.transform = 'translateY(0)';
                        document.body.style.opacity = '1';
                      }, 100);
                    }}
                  >
                    <span className="relative z-10 flex items-center">
                      Try Medinote Now
                      <ArrowRight className="w-6 h-6 ml-3 transition-transform group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                  </Button>
                </Link>
              </div>

              {/* Hospital Slider */}
              <div className="mb-8">
                <p className="text-sm text-gray-500 mb-4 text-center lg:text-left">Trusted by leading healthcare institutions</p>
                <div className="flex items-center space-x-8 opacity-60 animate-slide-in-left">
                  <div className="text-gray-400 font-semibold text-lg">Mayo Clinic</div>
                  <div className="text-gray-400 font-semibold text-lg">Johns Hopkins</div>
                  <div className="text-gray-400 font-semibold text-lg">Cleveland Clinic</div>
                  <div className="text-gray-400 font-semibold text-lg">Mass General</div>
                </div>
              </div>
            </div>

            {/* Right Content - Demo */}
            <div className="relative animate-slide-up">
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-xl border border-gray-600/30 rounded-3xl overflow-hidden shadow-2xl">
                {/* Demo Header */}
                <div className={`bg-gradient-to-r ${
                  demoExamples[currentDemoIndex].color === 'emerald' ? 'from-emerald-600/20 to-teal-600/20' :
                  demoExamples[currentDemoIndex].color === 'blue' ? 'from-blue-600/20 to-indigo-600/20' :
                  'from-purple-600/20 to-pink-600/20'
                } border-b border-gray-600/30 p-6`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${
                      demoExamples[currentDemoIndex].color === 'emerald' ? 'from-emerald-500 to-teal-600' :
                      demoExamples[currentDemoIndex].color === 'blue' ? 'from-blue-500 to-indigo-600' :
                      'from-purple-500 to-pink-600'
                    } rounded-2xl flex items-center justify-center`}>
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Live {demoExamples[currentDemoIndex].type} Generation</h3>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 ${
                          demoExamples[currentDemoIndex].color === 'emerald' ? 'bg-emerald-400' :
                          demoExamples[currentDemoIndex].color === 'blue' ? 'bg-blue-400' :
                          'bg-purple-400'
                        } rounded-full animate-pulse`}></div>
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
                        <div className={`w-2 h-2 ${
                          demoExamples[currentDemoIndex].color === 'emerald' ? 'bg-emerald-400' :
                          demoExamples[currentDemoIndex].color === 'blue' ? 'bg-blue-400' :
                          'bg-purple-400'
                        } rounded-full`}></div>
                        <span className="text-sm font-medium text-gray-300">Generated {demoExamples[currentDemoIndex].type}</span>
                      </div>
                      <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-4 max-h-80 overflow-y-auto">
                        <div className="text-gray-200 text-sm leading-relaxed font-mono whitespace-pre-wrap">
                          {demoExamples[currentDemoIndex].output}
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

      {/* How It Works Section */}
      <section id="features" className="relative z-10 py-32 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              See How It Works
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience the future of medical documentation with our intelligent workflow
            </p>
          </div>

          {/* Step by step process */}
          <div className="space-y-24">
            {/* Step 1 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="animate-slide-in-left">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-6">
                  Step 1
                </div>
                <h3 className="text-3xl font-bold text-white mb-6">Enter Patient Information</h3>
                <p className="text-xl text-gray-400 leading-relaxed mb-8">
                  Start with basic patient details. Our smart forms guide you through the essential information needed for comprehensive documentation.
                </p>
                <div className="flex items-center text-emerald-400 font-medium">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Intelligent auto-complete
                </div>
              </div>
              <div className="animate-slide-in-right">
                <Card className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 border-gray-600/30 backdrop-blur-lg">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <User className="w-5 h-5 text-emerald-400" />
                        <span className="text-white font-medium">Patient Information</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Name:</span>
                          <span className="text-white text-sm">John Smith</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Age:</span>
                          <span className="text-white text-sm">45</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Chief Complaint:</span>
                          <span className="text-white text-sm">Chest pain</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="lg:order-2 animate-slide-in-right">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-600/20 border border-teal-500/30 text-teal-300 text-sm font-medium mb-6">
                  Step 2
                </div>
                <h3 className="text-3xl font-bold text-white mb-6">AI Generates Each Section</h3>
                <p className="text-xl text-gray-400 leading-relaxed mb-8">
                  Watch as our AI crafts each SOAP section with medical precision. Generate sections individually or all at once.
                </p>
                <div className="flex items-center text-teal-400 font-medium">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Real-time generation
                </div>
              </div>
              <div className="lg:order-1 animate-slide-in-left">
                <Card className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 border-gray-600/30 backdrop-blur-lg">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-4">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse mr-3"></div>
                      <span className="text-emerald-400 text-sm">Generating SOAP Note...</span>
                    </div>
                    <div className="space-y-3">
                      <div className="text-gray-300 text-sm">
                        <strong>Subjective:</strong> Patient presents with...
                      </div>
                      <div className="h-2 bg-gradient-to-r from-emerald-500/30 to-gray-700 rounded animate-shimmer"></div>
                      <div className="text-gray-300 text-sm">
                        <strong>Objective:</strong> Vital signs stable...
                      </div>
                      <div className="h-2 bg-gradient-to-r from-emerald-500/30 to-gray-700 rounded w-4/5 animate-shimmer" style={{animationDelay: '0.3s'}}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="animate-slide-in-left">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-6">
                  Step 3
                </div>
                <h3 className="text-3xl font-bold text-white mb-6">Review & Refine</h3>
                <p className="text-xl text-gray-400 leading-relaxed mb-8">
                  Get AI-powered suggestions to improve clarity, completeness, and medical accuracy. Perfect your documentation before finalizing.
                </p>
                <div className="flex items-center text-cyan-400 font-medium">
                  <Shield className="w-5 h-5 mr-2" />
                  Quality assurance built-in
                </div>
              </div>
              <div className="animate-slide-in-right">
                <Card className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 border-gray-600/30 backdrop-blur-lg">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-yellow-400 text-sm font-medium">Review Complete</span>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-green-400 text-xs">✓ Medical terminology accurate</div>
                      <div className="text-green-400 text-xs">✓ Documentation complete</div>
                      <div className="text-yellow-400 text-xs">⚠ Consider adding vitals</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <span className="text-xl font-bold text-white">Medinote</span>
              <p className="text-gray-400 mt-4">The future of medical documentation</p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-gray-400">
                <div>Privacy Policy</div>
                <div>Terms of Service</div>
                <div>Security</div>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-gray-400">
                <div>Documentation</div>
                <div>Contact Us</div>
                <div>Help Center</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}