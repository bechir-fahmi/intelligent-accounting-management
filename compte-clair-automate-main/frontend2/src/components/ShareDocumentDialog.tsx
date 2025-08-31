import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { documentsService, SharedUser } from "@/services/documents.service";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { Loader2, X } from "lucide-react";

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
  const [email, setEmail] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      loadDocumentData();
    }
  }, [isOpen, documentId]);

  const loadDocumentData = async () => {
    await Promise.all([loadSharedUsers(), loadDocumentStatus()]);
  };

  const loadDocumentStatus = async () => {
    try {
      const document = await documentsService.getDocument(documentId);
      setIsPublic(document.isPublic);
    } catch (error) {
      console.error("Failed to load document status:", error);
    }
  };

  const loadSharedUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const users = await documentsService.getSharedUsers(documentId);
      setSharedUsers(users);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("documents.share.loadUsersError"),
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleShare = async () => {
    if (!email) {
      toast({
        title: t("common.error"),
        description: t("documents.share.enterEmail"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      // First find the user by email
      const user = await documentsService.searchUserByEmail(email);

      // Then share the document with the found user
      await documentsService.shareDocument(documentId, [user.id], false);
      toast({
        title: t("common.success"),
        description: t("documents.share.shareSuccess"),
      });
      onShareSuccess();
      setEmail("");
      // Refresh the shared users list
      loadSharedUsers();
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast({
          title: t("common.error"),
          description: t("documents.share.userNotFound"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("common.error"),
          description: t("documents.share.shareError"),
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublic = async (checked: boolean) => {
    try {
      setIsLoading(true);
      await documentsService.setDocumentPublic(documentId, checked);

      setIsPublic(checked);
      toast({
        title: t("common.success"),
        description: checked
          ? t("documents.share.publicSuccess")
          : t("documents.share.privateSuccess"),
      });
      onShareSuccess();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("documents.share.publicError"),
        variant: "destructive",
      });
      // Revert the switch state on error
      setIsPublic(!checked);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnshare = async (userId: string) => {
    try {
      setIsLoading(true);
      await documentsService.unshareDocument(documentId, userId);
      setSharedUsers((users) => users.filter((user) => user.id !== userId));
      toast({
        title: t("common.success"),
        description: t("documents.share.unshareSuccess"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("documents.share.unshareError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("documents.share.title")}</DialogTitle>
          <DialogDescription>
            {t("documents.share.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">{t("documents.share.userEmail")}</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder={t("documents.share.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleShare} disabled={isLoading || !email}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("documents.share.shareButton")
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              disabled={isLoading}
            />
            <Label htmlFor="public">{t("documents.share.makePublic")}</Label>
          </div>

          <div className="space-y-2">
            <Label>{t("documents.share.sharedUsers")}</Label>
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
                {t("documents.share.noSharedUsers")}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDocumentDialog;
