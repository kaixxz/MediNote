import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SoapBuilderProps {
  reportType?: "soap" | "progress" | "discharge";
  setReportType?: (type: "soap" | "progress" | "discharge") => void;
}
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Loader2, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Save, 
  FileText, 
  User, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Settings,
  Home,
  ArrowLeft,
  RefreshCw,
  Eye,
  Star
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { 
  GenerateSectionRequest, 
  GenerateSectionResponse,
  ReviewReportRequest,
  ReviewReportResponse,
  SaveDraftRequest,
  SoapDraft,
  PatientInfo
} from "@shared/schema";

interface SoapSection {
  title: string;
  key: "subjective" | "objective" | "assessment" | "plan";
  placeholder: string;
  description: string;
}

const getSectionsForReportType = (reportType: "soap" | "progress" | "discharge"): SoapSection[] => {
  switch (reportType) {
    case "progress":
      return [
        {
          title: "Current Status",
          key: "subjective",
          placeholder: "Patient's current condition, treatment day, overall progress...",
          description: "Current patient status and progress"
        },
        {
          title: "Subjective",
          key: "objective",
          placeholder: "Patient's reported symptoms, pain levels, concerns...",
          description: "What the patient reports"
        },
        {
          title: "Objective",
          key: "assessment",
          placeholder: "Vital signs, physical exam findings, test results...",
          description: "Observable findings"
        },
        {
          title: "Assessment & Plan",
          key: "plan",
          placeholder: "Clinical assessment and treatment plan moving forward...",
          description: "Clinical judgment and next steps"
        }
      ];
    case "discharge":
      return [
        {
          title: "Hospital Course",
          key: "subjective",
          placeholder: "Summary of hospital stay, procedures performed, complications...",
          description: "Summary of hospitalization"
        },
        {
          title: "Discharge Condition",
          key: "objective",
          placeholder: "Patient's condition at discharge, vital signs, functional status...",
          description: "Condition at discharge"
        },
        {
          title: "Discharge Instructions",
          key: "assessment",
          placeholder: "Medications, activity restrictions, diet instructions...",
          description: "Patient instructions"
        },
        {
          title: "Follow-up",
          key: "plan",
          placeholder: "Appointment schedule, monitoring requirements, contact information...",
          description: "Follow-up care plan"
        }
      ];
    default: // soap
      return [
        {
          title: "Subjective",
          key: "subjective",
          placeholder: "Patient's chief complaint, symptoms, and history as reported by the patient...",
          description: "What the patient tells you"
        },
        {
          title: "Objective",
          key: "objective",
          placeholder: "Vital signs, physical examination findings, laboratory results...",
          description: "What you observe and measure"
        },
        {
          title: "Assessment",
          key: "assessment",
          placeholder: "Clinical interpretation, diagnosis, differential diagnosis...",
          description: "Your clinical judgment"
        },
        {
          title: "Plan",
          key: "plan",
          placeholder: "Treatment plan, medications, follow-up instructions...",
          description: "What you will do"
        }
      ];
  }
};

const commonSymptoms = [
  "Fever", "Headache", "Nausea", "Vomiting", "Diarrhea", "Constipation",
  "Chest pain", "Shortness of breath", "Cough", "Fatigue", "Dizziness",
  "Abdominal pain", "Back pain", "Joint pain", "Rash", "Swelling"
];

const affectedSystems = [
  "Cardiovascular", "Respiratory", "Gastrointestinal", "Neurological",
  "Musculoskeletal", "Genitourinary", "Dermatological", "Endocrine",
  "Hematological", "Psychiatric", "Ophthalmological", "ENT"
];

export default function SoapBuilder({ reportType = "soap", setReportType }: SoapBuilderProps) {
  const [currentDraft, setCurrentDraft] = useState<SoapDraft | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({});
  const [sectionContent, setSectionContent] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(["subjective"]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);
  const [draftTitle, setDraftTitle] = useState("New Note");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch drafts query
  const { data: drafts } = useQuery({
    queryKey: ["/api/drafts"],
    queryFn: () => apiRequest("/api/drafts")
  });

  // Generate section mutation
  const generateSectionMutation = useMutation({
    mutationFn: async ({ section, content, patientInfo: info }: GenerateSectionRequest): Promise<GenerateSectionResponse> => {
      return apiRequest("/api/generate-section", {
        method: "POST",
        body: { section, content, patientInfo: info, reportType }
      });
    },
    onSuccess: (data, variables) => {
      setSectionContent(prev => ({
        ...prev,
        [variables.section]: data.content
      }));
      setCompletedSections(prev => [...new Set([...prev, variables.section])]);
      toast({
        title: "Section Generated",
        description: `${variables.section.charAt(0).toUpperCase() + variables.section.slice(1)} section has been generated successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate section",
        variant: "destructive"
      });
    }
  });

  // Review report mutation
  const reviewReportMutation = useMutation({
    mutationFn: async (data: ReviewReportRequest): Promise<ReviewReportResponse> => {
      return apiRequest("/api/review", {
        method: "POST", 
        body: data
      });
    },
    onSuccess: (data) => {
      setReviewData(data);
      setShowReview(true);
      toast({
        title: "Review Complete",
        description: "AI suggestions are ready for review."
      });
    },
    onError: (error) => {
      toast({
        title: "Review Failed",
        description: error instanceof Error ? error.message : "Failed to review report",
        variant: "destructive"
      });
    }
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: SaveDraftRequest): Promise<SoapDraft> => {
      if (currentDraft) {
        return apiRequest(`/api/drafts/${currentDraft.id}`, {
          method: "PUT",
          body: data
        });
      } else {
        return apiRequest("/api/drafts", {
          method: "POST",
          body: data
        });
      }
    },
    onSuccess: (data) => {
      setCurrentDraft(data);
      queryClient.invalidateQueries({ queryKey: ["/api/drafts"] });
      toast({
        title: "Draft Saved",
        description: "Your note has been saved successfully."
      });
    },
    onError: (error) => {
      console.error("Draft save error:", error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save draft",
        variant: "destructive"
      });
    }
  });

  const handleGenerateSection = (section: "subjective" | "objective" | "assessment" | "plan") => {
    const content = sectionContent[section];
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please enter some content before generating.",
        variant: "destructive"
      });
      return;
    }

    const info = {
      ...patientInfo,
      symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined
    };

    generateSectionMutation.mutate({ section, content, patientInfo: info });
  };

  const handleSaveDraft = () => {
    const draftData: SaveDraftRequest = {
      title: draftTitle,
      patientInfo,
      ...sectionContent,
      completedSections
    };
    saveDraftMutation.mutate(draftData);
  };

  const handleLoadDraft = (draft: SoapDraft) => {
    setCurrentDraft(draft);
    setDraftTitle(draft.title);
    setPatientInfo(draft.patientInfo || {});
    setSectionContent({
      subjective: draft.subjective || "",
      objective: draft.objective || "",
      assessment: draft.assessment || "",
      plan: draft.plan || ""
    });
    setCompletedSections(draft.completedSections || []);
    if (draft.patientInfo?.symptoms) {
      setSelectedSymptoms(draft.patientInfo.symptoms);
    }
    
    toast({
      title: "Draft Loaded",
      description: `Loaded "${draft.title}" successfully.`
    });
  };

  const handleReviewReport = () => {
    const { subjective, objective, assessment, plan } = sectionContent;
    if (!subjective || !objective || !assessment || !plan) {
      toast({
        title: "Incomplete Report",
        description: "Please complete all sections before reviewing.",
        variant: "destructive"
      });
      return;
    }
    reviewReportMutation.mutate({ subjective, objective, assessment, plan });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => {
      const newSymptoms = prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom];
      
      // Update patient info with current symptoms
      setPatientInfo(current => ({
        ...current,
        symptoms: newSymptoms
      }));
      
      return newSymptoms;
    });
  };

  const getReportConfig = () => {
    switch (reportType) {
      case "progress":
        return {
          title: "Progress Note Builder",
          description: "Create detailed patient progress documentation with AI assistance",
          color: "blue",
          gradientFrom: "from-blue-600",
          gradientTo: "to-indigo-600",
          bgGradient: "from-blue-50 via-white to-indigo-50"
        };
      case "discharge":
        return {
          title: "Discharge Summary Builder", 
          description: "Generate comprehensive hospital discharge documentation",
          color: "purple",
          gradientFrom: "from-purple-600",
          gradientTo: "to-pink-600",
          bgGradient: "from-purple-50 via-white to-pink-50"
        };
      default:
        return {
          title: "SOAP Note Builder",
          description: "Create structured medical documentation with AI assistance", 
          color: "emerald",
          gradientFrom: "from-emerald-600",
          gradientTo: "to-teal-600",
          bgGradient: "from-emerald-50 via-white to-teal-50"
        };
    }
  };

  const config = getReportConfig();
  const sections = getSectionsForReportType(reportType);

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-10 left-10 w-72 h-72 ${
          config.color === 'emerald' ? 'bg-emerald-500/5' :
          config.color === 'blue' ? 'bg-blue-500/5' :
          'bg-purple-500/5'
        } rounded-full mix-blend-multiply filter blur-3xl animate-float`}></div>
        <div className={`absolute top-32 right-20 w-96 h-96 ${
          config.color === 'emerald' ? 'bg-teal-500/5' :
          config.color === 'blue' ? 'bg-indigo-500/5' :
          'bg-pink-500/5'
        } rounded-full mix-blend-multiply filter blur-3xl animate-float`} style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 relative z-10">
        <div className="animate-slide-in-left">
          <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
          <p className="text-gray-400">{config.description}</p>
        </div>
          
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <Input 
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Draft title"
              className="w-48"
            />
            <Button 
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
              variant="outline"
            >
              {saveDraftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </Button>
            
            {/* Patient Assistant Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Assistant
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Input Assistant</SheetTitle>
                  <SheetDescription>
                    Configure patient information and symptoms to enhance AI generation
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-6 mt-6 pb-6">
                  {/* Patient Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Patient Information
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          value={patientInfo.age || ""}
                          onChange={(e) => setPatientInfo(prev => ({ 
                            ...prev, 
                            age: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                          placeholder="Age"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={patientInfo.gender} onValueChange={(value) => 
                          setPatientInfo(prev => ({ ...prev, gender: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="system">Affected System</Label>
                      <Select value={patientInfo.affectedSystem} onValueChange={(value) => 
                        setPatientInfo(prev => ({ ...prev, affectedSystem: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select affected system" />
                        </SelectTrigger>
                        <SelectContent>
                          {affectedSystems.map(system => (
                            <SelectItem key={system} value={system.toLowerCase()}>
                              {system}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="history">Medical History</Label>
                      <Textarea
                        id="history"
                        value={patientInfo.medicalHistory || ""}
                        onChange={(e) => setPatientInfo(prev => ({ 
                          ...prev, 
                          medicalHistory: e.target.value 
                        }))}
                        placeholder="Relevant medical history..."
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Symptoms */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Common Symptoms</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {commonSymptoms.map(symptom => (
                        <div key={symptom} className="flex items-center space-x-2">
                          <Checkbox
                            id={symptom}
                            checked={selectedSymptoms.includes(symptom)}
                            onCheckedChange={() => toggleSymptom(symptom)}
                          />
                          <Label htmlFor={symptom} className="text-sm">
                            {symptom}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {selectedSymptoms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {selectedSymptoms.map(symptom => (
                          <Badge key={symptom} variant="secondary">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Load Previous Drafts */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Load Previous Drafts</h3>
                    {drafts && drafts.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {drafts.map((draft: SoapDraft) => (
                          <Button
                            key={draft.id}
                            variant="ghost"
                            className="w-full justify-start text-left"
                            onClick={() => handleLoadDraft(draft)}
                          >
                            <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{draft.title}</span>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No saved drafts yet</p>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Report Sections */}
        <div className="space-y-6 relative z-10">
          {sections.map((section) => {
            const isExpanded = expandedSections.includes(section.key);
            const isCompleted = completedSections.includes(section.key);
            const isGenerating = generateSectionMutation.isPending && 
              generateSectionMutation.variables?.section === section.key;
            
            return (
              <Card key={section.key} className={`transition-all duration-300 hover:shadow-2xl hover:shadow-${config.color}-900/20 border-l-4 ${
                isCompleted ? `border-l-${config.color}-500` : 'border-l-gray-600'
              } transform hover:scale-[1.02] bg-gradient-to-r from-gray-900/80 to-gray-800/60 backdrop-blur-sm`}>
                <CardHeader 
                  className="cursor-pointer group"
                  onClick={() => toggleSection(section.key)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className={`w-5 h-5 text-${config.color}-400 transition-transform duration-300 group-hover:scale-110`} />
                      ) : (
                        <ChevronRight className={`w-5 h-5 text-${config.color}-400 transition-transform duration-300 group-hover:scale-110`} />
                      )}
                      <span className="group-hover:text-white transition-colors duration-300">{section.title}</span>
                      {isCompleted && (
                        <CheckCircle className={`w-5 h-5 text-${config.color}-500 animate-pulse`} />
                      )}
                      {!isCompleted && (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-normal group-hover:text-gray-300 transition-colors duration-300">
                      {section.description}
                    </p>
                  </CardTitle>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="space-y-4">
                    <Textarea
                      value={sectionContent[section.key]}
                      onChange={(e) => setSectionContent(prev => ({
                        ...prev,
                        [section.key]: e.target.value
                      }))}
                      placeholder={section.placeholder}
                      rows={6}
                      className="resize-none"
                    />
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        {sectionContent[section.key].length}/2000 characters
                      </p>
                      
                      <Button
                        onClick={() => handleGenerateSection(section.key)}
                        disabled={isGenerating || !sectionContent[section.key].trim()}
                        className={`bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} hover:from-emerald-500 hover:to-teal-500 text-white shadow-2xl shadow-emerald-900/50 hover:shadow-emerald-900/70 transition-all duration-500 transform hover:scale-105 border border-emerald-500/30 relative overflow-hidden group`}
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        <span className="relative z-10">Generate with AI</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* AI Review Modal */}
        <Dialog open={showReview} onOpenChange={setShowReview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                AI Review & Suggestions
              </DialogTitle>
              <DialogDescription>
                Our AI has analyzed your {reportType.toUpperCase()} note and provided suggestions for improvement.
              </DialogDescription>
            </DialogHeader>
            
            {reviewData && (
              <div className="space-y-6">
                {reviewData.suggestions?.map((suggestion: any, index: number) => (
                  <Card key={index} className="border-l-4 border-l-amber-500">
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">
                        {suggestion.section} Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {suggestion.issues.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-700 mb-2">Issues Identified:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                            {suggestion.issues.map((issue: string, i: number) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {suggestion.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2">Suggestions:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-green-600">
                            {suggestion.suggestions.map((sug: string, i: number) => (
                              <li key={i}>{sug}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReview(false)}
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowReview(false);
                      // Could trigger a regeneration based on suggestions
                    }}
                    className={`bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo}`}
                  >
                    Apply Suggestions
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Review Section */}
        {completedSections.length === 4 && (
          <Card className={`mt-8 border-${config.color}-200 bg-${config.color}-50`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-semibold text-${config.color}-900 mb-2`}>
                    {config.title.split(' ')[0]} Note Complete!
                  </h3>
                  <p className={`text-${config.color}-700`}>
                    All sections are completed. Generate AI suggestions to improve your documentation.
                  </p>
                </div>
                
                <Button
                  onClick={handleReviewReport}
                  disabled={reviewReportMutation.isPending}
                  variant="outline"
                  className={`border-${config.color}-300 text-${config.color}-700 hover:bg-${config.color}-100`}
                >
                  {reviewReportMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  AI Review & Suggestions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
}