import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { documentsService, SharedUser } from '@/services/documents.service';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ShareDocumentDialogProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onShareSuccess: () => void;
}

const ShareDocumentDialog: React.FC<ShareDocumentDialogProps> = ({
  documentId,
  isOpen,
  onClose,
  onShareSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSharedUsers();
    }
  }, [isOpen, documentId]);

  const loadSharedUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const users = await documentsService.getSharedUsers(documentId);
      setSharedUsers(users);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste des utilisateurs partagés',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleShare = async () => {
    if (!email) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer une adresse email',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      // First find the user by email
      const user = await documentsService.searchUserByEmail(email);
      
      // Then share the document with the found user
      await documentsService.shareDocument(documentId, [user.id], isPublic);
      toast({
        title: 'Succès',
        description: 'Document partagé avec succès',
      });
      onShareSuccess();
      setEmail('');
      // Refresh the shared users list
      loadSharedUsers();
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast({
          title: 'Erreur',
          description: 'Utilisateur non trouvé',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de partager le document',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnshare = async (userId: string) => {
    try {
      setIsLoading(true);
      await documentsService.unshareDocument(documentId, userId);
      setSharedUsers(users => users.filter(user => user.id !== userId));
      toast({
        title: 'Succès',
        description: 'Accès au document révoqué',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de révoquer l\'accès',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Partager le document</DialogTitle>
          <DialogDescription>
            Partagez ce document avec d'autres utilisateurs ou rendez-le public.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email de l'utilisateur</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                onClick={handleShare}
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Partager'
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public">Rendre public</Label>
          </div>

          <div className="space-y-2">
            <Label>Utilisateurs avec accès</Label>
            {isLoadingUsers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : sharedUsers.length > 0 ? (
              <div className="space-y-2">
                {sharedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnshare(user.id)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Aucun utilisateur n'a accès à ce document
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDocumentDialog; 