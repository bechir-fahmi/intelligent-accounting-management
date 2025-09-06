import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Plus, Edit, Trash, Mail } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { usersService, User, CreateUserDto, UpdateUserDto, USER_ROLES } from '@/services/users.service';
import { generateRandomPassword } from '@/lib/utils';
import PasswordDisplay from '@/components/PasswordDisplay';

const AdminUsers = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const [newUser, setNewUser] = useState<Omit<CreateUserDto, 'password'>>({
    name: '',
    email: '',
    type: 'accountant'
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: t("common.error"),
        description: t("pages.adminUsers.errorLoading"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    // Validation
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast({
        title: t("common.error"),
        description: t("pages.adminUsers.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    try {
      const password = generateRandomPassword(8);
      const userWithPassword: CreateUserDto = {
        ...newUser,
        password: password
      };
      
      await usersService.createUser(userWithPassword);
      
      setGeneratedPassword(password);
      setIsAddDialogOpen(false);
      setIsPasswordDialogOpen(true);
      setNewUser({
        name: '',
        email: '',
        type: 'accountant'
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: t("common.error"),
        description: t("pages.adminUsers.errorCreating"),
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUser) return;
    
    try {
      const updateData: UpdateUserDto = {
        name: currentUser.name,
        email: currentUser.email,
        type: currentUser.type
      };
      
      await usersService.updateUser(currentUser.id, updateData);
      toast({
        title: t("common.success"),
        description: t("pages.adminUsers.userUpdated"),
      });
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: t("common.error"),
        description: t("pages.adminUsers.errorUpdating"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm(t('pages.adminUsers.confirmDelete'))) {
      return;
    }

    try {
      await usersService.deleteUser(id);
      toast({
        title: t("common.success"),
        description: t("pages.adminUsers.userDeleted"),
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: t("common.error"),
        description: t("pages.adminUsers.errorDeleting"),
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: User) => {
    setCurrentUser(user);
    setIsEditDialogOpen(true);
  };

  const handleResetPassword = async (user: User) => {
    if (!window.confirm(`${t('pages.adminUsers.confirmResetPassword')} ${user.email} ?`)) {
      return;
    }

    try {
      await usersService.forgotPassword(user.email);
      
      toast({
        title: t("pages.adminUsers.emailSent"),
        description: `${t('pages.adminUsers.resetEmailSent')} ${user.email}`,
      });
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast({
        title: t("common.error"),
        description: t("pages.adminUsers.errorSendingReset"),
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (type: string) => {
    switch (type) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'accountant':
        return 'bg-green-100 text-green-800';
      case 'finance':
        return 'bg-blue-100 text-blue-800';
      case 'finance_director':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (type: string) => {
    const role = USER_ROLES.find(r => r.value === type);
    return role ? role.label : type;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="pt-16 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="h-6 w-6 mr-2" />
                {t('pages.adminUsers.title')}
              </h1>
              <p className="text-gray-500 mt-1">{t('pages.adminUsers.description')}</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('pages.adminUsers.addUser')}
            </Button>
          </div>
          
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('pages.adminUsers.name')}</TableHead>
                  <TableHead>{t('pages.adminUsers.email')}</TableHead>
                  <TableHead>{t('pages.adminUsers.role')}</TableHead>
                  <TableHead>{t('pages.adminUsers.createdAt')}</TableHead>
                  <TableHead>{t('pages.adminUsers.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.type)}`}>
                        {getRoleLabel(user.type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleResetPassword(user)}
                          title={t('pages.adminUsers.sendResetEmail')}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Dialog d'ajout d'utilisateur */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.adminUsers.addUserDialog')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('pages.adminUsers.name')}</Label>
              <Input 
                id="name" 
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('pages.adminUsers.email')}</Label>
              <Input 
                id="email" 
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>{t('common.note')}:</strong> {t('pages.adminUsers.passwordNote')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t('pages.adminUsers.role')}</Label>
              <Select 
                value={newUser.type}
                onValueChange={(value) => setNewUser({...newUser, type: value as any})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('pages.adminUsers.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleAddUser}
              disabled={!newUser.name.trim() || !newUser.email.trim()}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification d'utilisateur */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.adminUsers.editUserDialog')}</DialogTitle>
          </DialogHeader>
          {currentUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('pages.adminUsers.name')}</Label>
                <Input 
                  id="edit-name" 
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t('pages.adminUsers.email')}</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">{t('pages.adminUsers.role')}</Label>
                <Select 
                  value={currentUser.type}
                  onValueChange={(value) => setCurrentUser({...currentUser, type: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('pages.adminUsers.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdateUser}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'affichage du mot de passe généré */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.adminUsers.userCreatedSuccess')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm text-green-700 mb-3">
                {t('pages.adminUsers.userCreated')}. {t('pages.adminUsers.generatedPassword')}
              </p>
              <PasswordDisplay password={generatedPassword} />
            </div>
            <div className="bg-amber-50 p-3 rounded-md">
              <p className="text-sm text-amber-700">
                <strong>{t('common.important')} :</strong> {t('pages.adminUsers.passwordImportant')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPasswordDialogOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default AdminUsers;
