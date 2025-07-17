import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  Settings
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

const soapSections: SoapSection[] = [
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

export default function SoapBuilder() {
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
  const [draftTitle, setDraftTitle] = useState("New SOAP Note");
  
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
        body: { section, content, patientInfo: info }
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
    onSuccess: () => {
      setShowReview(true);
      toast({
        title: "Review Complete",
        description: "AI suggestions are ready for review."
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
        description: "Your SOAP note has been saved successfully."
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
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SOAP Note Builder</h1>
            <p className="text-gray-600">Create structured medical documentation with AI assistance</p>
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
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Input Assistant</SheetTitle>
                  <SheetDescription>
                    Configure patient information and symptoms to enhance AI generation
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
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
                      <div className="space-y-2">
                        {drafts.map((draft: SoapDraft) => (
                          <Button
                            key={draft.id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => handleLoadDraft(draft)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {draft.title}
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

        {/* SOAP Sections */}
        <div className="space-y-6">
          {soapSections.map((section) => {
            const isExpanded = expandedSections.includes(section.key);
            const isCompleted = completedSections.includes(section.key);
            const isGenerating = generateSectionMutation.isPending && 
              generateSectionMutation.variables?.section === section.key;
            
            return (
              <Card key={section.key} className="transition-all duration-200 hover:shadow-md">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => toggleSection(section.key)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <span>{section.title}</span>
                      {isCompleted && (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      )}
                      {!isCompleted && (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-normal">
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
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Generate with AI
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Review Section */}
        {completedSections.length === 4 && (
          <Card className="mt-8 border-emerald-200 bg-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-emerald-900 mb-2">
                    SOAP Note Complete!
                  </h3>
                  <p className="text-emerald-700">
                    All sections are completed. Generate AI suggestions to improve your documentation.
                  </p>
                </div>
                
                <Button
                  onClick={handleReviewReport}
                  disabled={reviewReportMutation.isPending}
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                >
                  {reviewReportMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  )}
                  Review & Improve
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}