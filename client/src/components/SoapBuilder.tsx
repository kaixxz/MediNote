import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

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
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  
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
      
      // Refresh credits after using one
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      
      toast({
        title: "Section Generated",
        description: `${variables.section.charAt(0).toUpperCase() + variables.section.slice(1)} section has been generated successfully. 1 credit used.`
      });
    },
    onError: (error: any) => {
      // Check if it's a credit error
      if (error.message?.includes("Insufficient credits")) {
        toast({
          title: "Not Enough Credits",
          description: "You need more credits to generate AI content. Click 'Buy Credits' to continue.",
          variant: "destructive",
        });
        return;
      }
      
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
      
      // Refresh credits after using one
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      
      toast({
        title: "Review Complete",
        description: "AI suggestions are ready for review. 1 credit used."
      });
    },
    onError: (error: any) => {
      // Check if it's a credit error
      if (error.message?.includes("Insufficient credits")) {
        toast({
          title: "Not Enough Credits",
          description: "You need more credits to get AI review. Click 'Buy Credits' to continue.",
          variant: "destructive",
        });
        return;
      }
      
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
      // Show checkmark effect instead of toast
      const saveButton = document.querySelector('[data-save-button]') as HTMLElement;
      if (saveButton) {
        saveButton.classList.add('save-success');
        setTimeout(() => {
          saveButton.classList.remove('save-success');
        }, 2000);
      }
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

  const handleDownloadPDF = () => {
    const { subjective, objective, assessment, plan } = sectionContent;
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(20);
    pdf.text("Medical Documentation Report", 20, 30);
    
    // Add patient info if available
    if (patientInfo.patientName) {
      pdf.setFontSize(12);
      pdf.text(`Patient: ${patientInfo.patientName}`, 20, 50);
      if (patientInfo.mrn) {
        pdf.text(`MRN: ${patientInfo.mrn}`, 20, 60);
      }
      if (patientInfo.doctorName) {
        pdf.text(`Doctor: ${patientInfo.doctorName}`, 20, 70);
      }
    }
    
    let yPosition = patientInfo.patientName ? 90 : 50;
    
    // Add sections
    const sections = [
      { title: "SUBJECTIVE", content: subjective },
      { title: "OBJECTIVE", content: objective },
      { title: "ASSESSMENT", content: assessment },
      { title: "PLAN", content: plan }
    ];
    
    sections.forEach(section => {
      pdf.setFontSize(14);
      pdf.text(section.title, 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(section.content, 170);
      pdf.text(lines, 20, yPosition);
      yPosition += lines.length * 5 + 10;
      
      // Add new page if needed
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
    });
    
    // Save the PDF
    const fileName = `medical-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    toast({
      title: "PDF Downloaded",
      description: "Your medical report has been saved as a PDF."
    });
  };

  const handleDownloadDOCX = async () => {
    const { subjective, objective, assessment, plan } = sectionContent;
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Medical Documentation Report",
            heading: HeadingLevel.HEADING_1,
          }),
          ...(patientInfo.patientName ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Patient: ${patientInfo.patientName}`,
                  bold: true,
                }),
              ],
            }),
            ...(patientInfo.mrn ? [new Paragraph({
              children: [
                new TextRun({
                  text: `MRN: ${patientInfo.mrn}`,
                  bold: true,
                }),
              ],
            })] : []),
            ...(patientInfo.doctorName ? [new Paragraph({
              children: [
                new TextRun({
                  text: `Doctor: ${patientInfo.doctorName}`,
                  bold: true,
                }),
              ],
            })] : []),
            new Paragraph({ text: "" }), // Empty line
          ] : []),
          new Paragraph({
            children: [
              new TextRun({
                text: "SUBJECTIVE",
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            text: subjective,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: "OBJECTIVE",
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            text: objective,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: "ASSESSMENT",
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            text: assessment,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: "PLAN",
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            text: plan,
          }),
        ],
      }],
    });

    try {
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical-report-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "DOCX Downloaded",
        description: "Your medical report has been saved as a Word document."
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to create DOCX file. Please try again.",
        variant: "destructive"
      });
    }
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

  // Smart auto-fill function that uses AI to populate relevant fields based on selected symptoms
  const handleAutoFill = async () => {
    if (selectedSymptoms.length === 0) {
      toast({
        title: "No Symptoms Selected",
        description: "Please select at least one symptom to auto-fill",
        variant: "destructive"
      });
      return;
    }

    setIsAutoFilling(true);
    try {
      // Use the first selected symptom for suggestions
      const primarySymptom = selectedSymptoms[0];
      const suggestions = await getSmartSuggestions(primarySymptom);
      
      let fieldsUpdated = [];
      
      // Auto-fill chief complaint if empty
      if (!patientInfo.chiefComplaint && suggestions.chiefComplaint) {
        setPatientInfo(prev => ({
          ...prev,
          chiefComplaint: suggestions.chiefComplaint
        }));
        fieldsUpdated.push("Chief Complaint");
      }
      
      // Auto-fill affected system if not set
      if (!patientInfo.affectedSystem && suggestions.affectedSystem) {
        setPatientInfo(prev => ({
          ...prev,
          affectedSystem: suggestions.affectedSystem
        }));
        fieldsUpdated.push("Affected System");
      }
      
      // Auto-fill subjective section if empty
      if (!sectionContent.subjective && suggestions.subjectiveContent) {
        setSectionContent(prev => ({
          ...prev,
          subjective: suggestions.subjectiveContent
        }));
        fieldsUpdated.push("Subjective Section");
      }
      
      if (fieldsUpdated.length > 0) {
        toast({
          title: "AI Auto-Fill Complete",
          description: `Updated: ${fieldsUpdated.join(", ")} based on "${primarySymptom}"`,
        });
      } else {
        toast({
          title: "No Updates Needed",
          description: "All relevant fields are already filled",
        });
      }
    } catch (error) {
      toast({
        title: "Auto-Fill Failed",
        description: "Unable to generate suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Get AI suggestions based on symptom
  const getSmartSuggestions = async (symptom: string) => {
    const response = await apiRequest("/api/smart-suggestions", {
      method: "POST",
      body: { 
        symptom,
        currentInfo: patientInfo,
        reportType
      }
    });
    return response;
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
              className="transition-all duration-300"
              data-save-button
            >
              {saveDraftMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2 save-icon" />
                  <Check className="w-4 h-4 mr-2 check-icon opacity-0" />
                </>
              )}
              <span className="save-text">Save Draft</span>
              <span className="success-text opacity-0 absolute">Saved!</span>
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
              <SheetContent className="w-[400px] sm:w-[540px] h-full max-h-screen overflow-hidden bg-gradient-to-br from-slate-950 to-slate-900 border-l-2 border-blue-500/30 flex flex-col">
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
                
                <div className="flex-1 overflow-y-auto space-y-8 mt-6 pb-6">
                  {/* Patient Demographics */}
                  <div className="space-y-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-500/20">
                    <h3 className="font-semibold flex items-center gap-2 text-blue-300">
                      <User className="w-5 h-5 animate-pulse" />
                      Patient Demographics
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="patientName">Patient Name</Label>
                        <Input
                          id="patientName"
                          value={patientInfo.patientName || ""}
                          onChange={(e) => setPatientInfo(prev => ({ 
                            ...prev, 
                            patientName: e.target.value 
                          }))}
                          placeholder="John Doe"
                        />
                      </div>
                      
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={patientInfo.dateOfBirth || ""}
                            onChange={(e) => setPatientInfo(prev => ({ 
                              ...prev, 
                              dateOfBirth: e.target.value 
                            }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="mrn">MRN</Label>
                          <Input
                            id="mrn"
                            value={patientInfo.mrn || ""}
                            onChange={(e) => setPatientInfo(prev => ({ 
                              ...prev, 
                              mrn: e.target.value 
                            }))}
                            placeholder="Medical Record #"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="bg-blue-500/20" />
                  
                  {/* Healthcare Provider Info */}
                  <div className="space-y-4 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-xl p-6 border border-emerald-500/20">
                    <h3 className="font-semibold flex items-center gap-2 text-emerald-300">
                      <Settings className="w-5 h-5 animate-pulse" />
                      Healthcare Provider
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="doctorName">Doctor Name</Label>
                        <Input
                          id="doctorName"
                          value={patientInfo.doctorName || ""}
                          onChange={(e) => setPatientInfo(prev => ({ 
                            ...prev, 
                            doctorName: e.target.value 
                          }))}
                          placeholder="Dr. John Smith, MD"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="hospitalName">Hospital/Clinic Name</Label>
                        <Input
                          id="hospitalName"
                          value={patientInfo.hospitalName || ""}
                          onChange={(e) => setPatientInfo(prev => ({ 
                            ...prev, 
                            hospitalName: e.target.value 
                          }))}
                          placeholder="General Hospital"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="department">Department</Label>
                          <Input
                            id="department"
                            value={patientInfo.department || ""}
                            onChange={(e) => setPatientInfo(prev => ({ 
                              ...prev, 
                              department: e.target.value 
                            }))}
                            placeholder="Internal Medicine"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="visitDate">Visit Date</Label>
                          <Input
                            id="visitDate"
                            type="date"
                            value={patientInfo.visitDate || ""}
                            onChange={(e) => setPatientInfo(prev => ({ 
                              ...prev, 
                              visitDate: e.target.value 
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="bg-blue-500/20" />
                  
                  {/* Medical Information */}
                  <div className="space-y-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/20">
                    <h3 className="font-semibold flex items-center gap-2 text-purple-300">
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                      Medical Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                        <Input
                          id="chiefComplaint"
                          value={patientInfo.chiefComplaint || ""}
                          onChange={(e) => setPatientInfo(prev => ({ 
                            ...prev, 
                            chiefComplaint: e.target.value 
                          }))}
                          placeholder="Main reason for visit..."
                        />
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
                        <Label htmlFor="allergies">Allergies</Label>
                        <Textarea
                          id="allergies"
                          value={patientInfo.allergies || ""}
                          onChange={(e) => setPatientInfo(prev => ({ 
                            ...prev, 
                            allergies: e.target.value 
                          }))}
                          placeholder="Known allergies and reactions..."
                          rows={2}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="currentMedications">Current Medications</Label>
                        <Textarea
                          id="currentMedications"
                          value={patientInfo.currentMedications || ""}
                          onChange={(e) => setPatientInfo(prev => ({ 
                            ...prev, 
                            currentMedications: e.target.value 
                          }))}
                          placeholder="Current medications and dosages..."
                          rows={2}
                        />
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
                  </div>
                  
                  <Separator className="bg-blue-500/20" />
                  
                  {/* Symptoms */}
                  <div className="space-y-4 bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-xl p-6 border border-orange-500/20">
                    <h3 className="font-semibold flex items-center gap-2 text-orange-300">
                      <Zap className="w-5 h-5 animate-pulse" />
                      Common Symptoms
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {commonSymptoms.map(symptom => (
                        <div key={symptom} className="flex items-center space-x-2 relative">
                          <Checkbox
                            id={symptom}
                            checked={selectedSymptoms.includes(symptom)}
                            onCheckedChange={() => toggleSymptom(symptom)}
                            disabled={isAutoFilling}
                          />
                          <Label htmlFor={symptom} className={`text-sm ${isAutoFilling ? 'opacity-50' : ''}`}>
                            {symptom}
                          </Label>
                          {isAutoFilling && selectedSymptoms.includes(symptom) && (
                            <div className="absolute -right-1 -top-1">
                              <Sparkles className="w-3 h-3 text-blue-400 animate-spin" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {isAutoFilling && (
                      <div className="flex items-center gap-2 text-blue-400 text-sm mt-3 p-2 bg-blue-900/20 rounded-lg border border-blue-500/30">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI is auto-filling relevant fields...</span>
                      </div>
                    )}
                    
                    {selectedSymptoms.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedSymptoms.map(symptom => (
                            <Badge key={symptom} variant="secondary">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button 
                          onClick={handleAutoFill}
                          disabled={isAutoFilling}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                        >
                          {isAutoFilling ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              AI Auto-Filling...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Smart Auto-Fill Fields
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="bg-blue-500/20" />
                  
                  {/* Load Previous Drafts */}
                  <div className="space-y-4 bg-gradient-to-r from-slate-900/20 to-gray-900/20 rounded-xl p-6 border border-slate-500/20">
                    <h3 className="font-semibold flex items-center gap-2 text-slate-300">
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
          <DialogContent className="max-w-6xl max-h-[90vh] p-0 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100]">
            <div className="flex h-[80vh] overflow-hidden">
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
              <div className="w-96 bg-gradient-to-br from-slate-900 to-slate-800 border-l border-slate-700 overflow-y-auto max-h-full">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Review Complete</h3>
                  </div>
                  
                  {reviewData && (
                    <div className="space-y-4">
                      {/* Completed Items */}
                      {reviewData.completedItems?.length > 0 && (
                        <div className="space-y-3">
                          {reviewData.completedItems.map((item: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 text-green-400">
                              <CheckCircle className="w-5 h-5 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Suggestions */}
                      {reviewData.suggestions?.length > 0 && (
                        <div className="space-y-3 mt-6">
                          {reviewData.suggestions.map((suggestion: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 text-amber-400">
                              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                              <span className="text-sm">{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Empty state */}
                      {(!reviewData.completedItems?.length && !reviewData.suggestions?.length) && (
                        <div className="text-center py-8 text-gray-400">
                          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">Unable to analyze documentation. Please try again.</p>
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
          <DialogContent className="sm:max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
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
                  onClick={() => {
                    handleDownloadPDF();
                    setShowExport(false);
                  }}
                >
                  <Download className="w-8 h-8 text-red-600" />
                  <span>Download PDF</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:bg-blue-50"
                  onClick={() => {
                    handleDownloadDOCX();
                    setShowExport(false);
                  }}
                >
                  <Download className="w-8 h-8 text-blue-600" />
                  <span>Download DOCX</span>
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