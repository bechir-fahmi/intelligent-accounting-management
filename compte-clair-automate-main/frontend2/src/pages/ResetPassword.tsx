import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usersService } from "@/services/users.service";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";

const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const result = await usersService.validateResetToken(token);
        setIsValidToken(result.valid);
      } catch (error) {
        console.error("Error validating token:", error);
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("resetPassword.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t("common.error"),
        description: t("resetPassword.passwordTooShort"),
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: t("common.error"),
        description: t("resetPassword.missingToken"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await usersService.resetPassword(token, password);
      setIsSuccess(true);
      toast({
        title: t("common.success"),
        description: t("resetPassword.resetSuccess"),
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: t("common.error"),
        description: t("resetPassword.resetError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                {t("resetPassword.validatingLink")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              {t("resetPassword.invalidLink")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {t("resetPassword.invalidLinkDescription")}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={() => navigate("/login")} className="w-full">
                {t("resetPassword.backToLogin")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              {t("resetPassword.passwordReset")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                {t("resetPassword.passwordResetSuccess")}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={() => navigate("/login")} className="w-full">
                {t("resetPassword.goToLogin")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            {t("resetPassword.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("resetPassword.newPassword")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("resetPassword.newPasswordPlaceholder")}
                  required
                  minLength={6}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("resetPassword.confirmPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <Alert variant="destructive">
                <AlertDescription>
                  {t("resetPassword.passwordMismatch")}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading || password !== confirmPassword || password.length < 6
              }
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("resetPassword.resetting")}
                </>
              ) : (
                t("resetPassword.resetPasswordButton")
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate("/login")}
              className="text-sm"
            >
              {t("resetPassword.backToLogin")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
