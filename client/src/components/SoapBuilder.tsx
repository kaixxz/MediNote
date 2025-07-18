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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Star,
  Trash2,
  Download,
  Copy,
  X,
  Check,
  Bot,
  Zap
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx" | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
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

  // Delete draft mutation
  const deleteDraftMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiRequest(`/api/drafts/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drafts"] });
      setShowDeleteConfirm(null);
      setDeleteConfirmText("");
      toast({
        title: "Draft Deleted",
        description: "The draft has been permanently deleted.",
        variant: "destructive"
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete draft",
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
    if (!draftTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your draft.",
        variant: "destructive"
      });
      return;
    }
    
    const draftData: SaveDraftRequest = {
      title: draftTitle.trim(),
      patientInfo: {
        ...patientInfo,
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined
      },
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

  const handleDeleteDraft = (draft: SoapDraft) => {
    setShowDeleteConfirm({ id: draft.id, title: draft.title });
    setDeleteConfirmText("");
  };

  const confirmDelete = () => {
    if (showDeleteConfirm && deleteConfirmText === `I want to delete ${showDeleteConfirm.title}`) {
      deleteDraftMutation.mutate(showDeleteConfirm.id);
    }
  };

  const handleExportComplete = () => {
    setShowExport(true);
  };

  const handleCopyToClipboard = () => {
    const { subjective, objective, assessment, plan } = sectionContent;
    const fullReport = `SUBJECTIVE:\n${subjective}\n\nOBJECTIVE:\n${objective}\n\nASSESSMENT:\n${assessment}\n\nPLAN:\n${plan}`;
    
    navigator.clipboard.writeText(fullReport).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast({
        title: "Copied to Clipboard",
        description: "Your report has been copied to clipboard."
      });
    });
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
            <Sheet open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="group relative overflow-hidden">
                  <div className="flex items-center">
                    <Bot className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                    <span className="mr-2">Dr. MediAI</span>
                    <Star className="w-4 h-4 text-yellow-500 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-gradient-to-br from-slate-950 to-slate-900 border-l-2 border-blue-500/30">
                <SheetHeader className="pb-6">
                  <SheetTitle className="flex items-center gap-2 text-2xl">
                    <Bot className="w-6 h-6 text-blue-400 animate-pulse" />
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Dr. MediAI
                    </span>
                    <Star className="w-5 h-5 text-yellow-500 animate-pulse" />
                  </SheetTitle>
                  <SheetDescription className="text-gray-300">
                    Your AI medical documentation assistant - Configure patient information and symptoms to enhance AI generation
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-8 mt-6 pb-6">
                  {/* Patient Info */}
                  <div className="space-y-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-500/20">
                    <h3 className="font-semibold flex items-center gap-2 text-blue-300">
                      <User className="w-5 h-5 animate-pulse" />
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
                  
                  <Separator className="bg-blue-500/20" />
                  
                  {/* Symptoms */}
                  <div className="space-y-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/20">
                    <h3 className="font-semibold flex items-center gap-2 text-purple-300">
                      <Zap className="w-5 h-5 animate-pulse" />
                      Common Symptoms
                    </h3>
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
                  
                  <Separator className="bg-blue-500/20" />
                  
                  {/* Load Previous Drafts */}
                  <div className="space-y-4 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-xl p-6 border border-emerald-500/20">
                    <h3 className="font-semibold flex items-center gap-2 text-emerald-300">
                      <FileText className="w-5 h-5 animate-pulse" />
                      Previous Drafts
                    </h3>
                    {drafts && drafts.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {drafts.map((draft: SoapDraft) => (
                          <div key={draft.id} className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-200 group">
                            <Button
                              variant="ghost"
                              className="flex-1 justify-start text-left h-auto p-0 hover:bg-transparent"
                              onClick={() => handleLoadDraft(draft)}
                            >
                              <FileText className="w-4 h-4 mr-2 flex-shrink-0 text-emerald-400 group-hover:animate-pulse" />
                              <span className="truncate text-gray-300 group-hover:text-white">{draft.title}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              onClick={() => handleDeleteDraft(draft)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4 animate-pulse" />
                        <p className="text-gray-500">Empty :( No saved drafts yet</p>
                      </div>
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

        {/* AI Review Sidebar */}
        <Dialog open={showReview} onOpenChange={setShowReview}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
            <div className="flex h-[80vh]">
              {/* Report Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-bold">Review Your Documentation</DialogTitle>
                  <DialogDescription>
                    Review your completed note and apply AI suggestions for improvement.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {sections.map((section) => (
                    <Card key={section.key} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-lg capitalize">{section.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap text-gray-700">
                            {sectionContent[section.key] || "No content yet"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* AI Review Sidebar */}
              <div className="w-96 bg-gradient-to-br from-slate-900 to-slate-800 border-l border-slate-700 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Review Complete</h3>
                  </div>
                  
                  {reviewData && reviewData.suggestions && (
                    <div className="space-y-4">
                      {/* Success Items */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Medical terminology accurate</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Documentation complete</span>
                        </div>
                      </div>
                      
                      {/* Warnings/Suggestions */}
                      {reviewData.suggestions.length > 0 && (
                        <div className="space-y-3 mt-6">
                          {reviewData.suggestions.map((suggestion: any, index: number) => (
                            <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm font-medium text-yellow-300 capitalize">
                                  {suggestion.section} Section
                                </span>
                              </div>
                              
                              {suggestion.issues.length > 0 && (
                                <div className="mb-3">
                                  <ul className="text-xs text-gray-300 space-y-1">
                                    {suggestion.issues.map((issue: string, i: number) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-yellow-400 mt-1">•</span>
                                        <span>{issue}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {suggestion.suggestions.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-medium text-green-400 mb-1">Suggestions:</h5>
                                  <ul className="text-xs text-gray-300 space-y-1">
                                    {suggestion.suggestions.map((sug: string, i: number) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-green-400 mt-1">•</span>
                                        <span>{sug}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-3 mt-8">
                    <Button 
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      onClick={() => {
                        setShowReview(false);
                        handleExportComplete();
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Export
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                      onClick={() => setShowReview(false)}
                    >
                      Continue Editing
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Review Section */}
        {completedSections.length === 4 && (
          <Card className="mt-8 border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    {config.title.split(' ')[0]} Note Complete!
                  </h3>
                  <p className="text-green-700">
                    All sections are completed. Review and export your documentation.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleReviewReport}
                    disabled={reviewReportMutation.isPending}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    {reviewReportMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    AI Review
                  </Button>
                  <Button
                    onClick={handleExportComplete}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete & Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Draft</DialogTitle>
              <DialogDescription>
                This action cannot be undone. To confirm deletion, please type exactly:
                <br />
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded mt-2 block">
                  I want to delete {showDeleteConfirm?.title}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type the confirmation text..."
                className="font-mono text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteConfirmText !== `I want to delete ${showDeleteConfirm?.title}` || deleteDraftMutation.isPending}
                  onClick={confirmDelete}
                >
                  {deleteDraftMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Forever
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={showExport} onOpenChange={setShowExport}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-green-600">Export Complete!</DialogTitle>
              <DialogDescription>
                Your medical documentation is ready. Choose how you'd like to save it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:bg-red-50"
                  onClick={() => setExportFormat("pdf")}
                >
                  <FileText className="w-8 h-8 text-red-600" />
                  <span>PDF</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:bg-blue-50"
                  onClick={() => setExportFormat("docx")}
                >
                  <FileText className="w-8 h-8 text-blue-600" />
                  <span>DOC/DOCX</span>
                </Button>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 relative group"
                  onClick={handleCopyToClipboard}
                >
                  {copySuccess ? (
                    <Check className="w-4 h-4 text-green-600 animate-pulse" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copySuccess ? "Copied!" : "Copy to Clipboard"}</span>
                  <div className="absolute inset-0 bg-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded"></div>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}