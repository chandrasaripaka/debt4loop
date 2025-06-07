import { useQuery } from "@tanstack/react-query";
import { Bell, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: company } = useQuery({
    queryKey: ["/api/company/current"],
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-dark-gray">{title}</h2>
          <p className="text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-dark-gray">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-error text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                2
              </span>
            </Button>
          </div>
          
          {/* Company Profile */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-dark-gray">
                {company?.name || "Acme Corp"}
              </p>
              <p className="text-xs text-gray-500">
                ID: {company?.anonymousId || "ANX-2847"}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
