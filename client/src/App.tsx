import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Generator from "@/pages/generator";
import ProgressNotePage from "@/pages/progress";
import DischargePage from "@/pages/discharge";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/soap" component={Generator} />
      <Route path="/progress" component={ProgressNotePage} />
      <Route path="/discharge" component={DischargePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="relative min-h-screen">
          <Router />
          <Toaster 
            position="bottom-left" 
            className="fixed bottom-4 left-4 z-50 max-w-md"
          />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
