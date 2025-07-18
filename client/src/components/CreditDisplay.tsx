import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Zap, CreditCard, CheckCircle, Sparkles, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserCreditsResponse } from "@shared/schema";

interface CreditDisplayProps {
  className?: string;
}

export default function CreditDisplay({ className }: CreditDisplayProps) {
  const [showPurchase, setShowPurchase] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user credits
  const { data: credits, isLoading } = useQuery<UserCreditsResponse>({
    queryKey: ["/api/credits"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Purchase credits mutation
  const purchaseCredits = useMutation({
    mutationFn: async (packageType: string) => {
      return apiRequest("/api/credits/purchase", {
        method: "POST",
        body: { package: packageType }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      setShowPurchase(false);
      toast({
        title: "Credits Purchased!",
        description: `Successfully added ${data.purchased} credits to your account.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to purchase credits",
        variant: "destructive",
      });
    }
  });

  const packages = [
    {
      id: "small",
      name: "Starter",
      credits: 5,
      price: "$2.00",
      description: "Perfect for trying out the AI features",
      popular: false
    },
    {
      id: "medium",
      name: "Professional",
      credits: 15,
      price: "$5.00",
      description: "Great for regular medical documentation",
      popular: true
    },
    {
      id: "large",
      name: "Enterprise",
      credits: 35,
      price: "$10.00",
      description: "Best value for heavy usage",
      popular: false
    }
  ];

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  const userCredits = credits?.credits || 0;
  const isLowCredits = userCredits <= 1;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Zap className={`w-4 h-4 ${isLowCredits ? 'text-red-500' : 'text-yellow-500'}`} />
        <span className={`font-semibold ${isLowCredits ? 'text-red-600' : 'text-gray-700'}`}>
          {userCredits} credits
        </span>
      </div>
      
      <Dialog open={showPurchase} onOpenChange={setShowPurchase}>
        <DialogTrigger asChild>
          <Button 
            variant={isLowCredits ? "destructive" : "outline"} 
            size="sm"
            className="text-xs"
          >
            <CreditCard className="w-3 h-3 mr-1" />
            {isLowCredits ? "Buy More" : "Buy Credits"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Purchase AI Credits
            </DialogTitle>
            <DialogDescription>
              Credits are used for AI-powered features like section generation and report reviews.
              Each AI operation costs 1 credit.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={`relative ${pkg.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription className="text-sm">{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-blue-600">{pkg.credits}</div>
                    <div className="text-sm text-gray-500">credits</div>
                  </div>
                  <div className="text-2xl font-bold mb-4">{pkg.price}</div>
                  <Button
                    onClick={() => purchaseCredits.mutate(pkg.id)}
                    disabled={purchaseCredits.isPending}
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    {purchaseCredits.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Purchase
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What can you do with credits?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Generate AI-powered SOAP sections (1 credit each)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Get AI review and suggestions for your reports (1 credit)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Auto-fill patient information (FREE)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Save and manage drafts (FREE)
              </li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}