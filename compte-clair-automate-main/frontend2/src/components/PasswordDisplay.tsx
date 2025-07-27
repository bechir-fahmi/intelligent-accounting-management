import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface PasswordDisplayProps {
  password: string;
  label?: string;
}

const PasswordDisplay: React.FC<PasswordDisplayProps> = ({ 
  password, 
  label = "Mot de passe généré" 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast({
        title: "Copié!",
        description: "Le mot de passe a été copié dans le presse-papiers",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le mot de passe",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            readOnly
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="px-3"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Assurez-vous de communiquer ce mot de passe à l'utilisateur de manière sécurisée.
      </p>
    </div>
  );
};

export default PasswordDisplay;