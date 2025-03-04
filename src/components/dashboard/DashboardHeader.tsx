
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  userRole: string;
}

const DashboardHeader = ({ userRole }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Duct Points dashboard.
        </p>
      </div>
      
      {userRole === "Admin" && (
        <Button 
          onClick={() => navigate("/admin")} 
          variant="outline" 
          className="rounded-full gap-2"
        >
          Admin Dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default DashboardHeader;
