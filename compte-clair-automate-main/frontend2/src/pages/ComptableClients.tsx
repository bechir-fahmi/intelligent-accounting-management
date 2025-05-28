
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Edit, Trash } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

// Mock data for clients
const initialClients = [
  { 
    id: 1, 
    name: "Société A", 
    contactName: "Jean Dupont", 
    email: "contact@societeA.com",
    phone: "01 23 45 67 89",
    status: "Actif",
    sector: "Technologie"
  },
  { 
    id: 2, 
    name: "Entreprise B", 
    contactName: "Marie Martin", 
    email: "contact@entrepriseB.com",
    phone: "01 98 76 54 32",
    status: "Actif",
    sector: "Immobilier"
  },
  { 
    id: 3, 
    name: "Commerce C", 
    contactName: "Paul Bernard", 
    email: "contact@commerceC.com",
    phone: "01 45 67 89 10",
    status: "Inactif",
    sector: "Commerce"
  }
];

const ComptableClients = () => {
  const [clients, setClients] = useState(initialClients);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    sector: 'Technologie'
  });
  const [currentClient, setCurrentClient] = useState<any>(null);

  const handleAddClient = () => {
    const id = Math.max(...clients.map(c => c.id)) + 1;
    const clientToAdd = {
      id,
      name: newClient.name,
      contactName: newClient.contactName,
      email: newClient.email,
      phone: newClient.phone,
      sector: newClient.sector,
      status: 'Actif'
    };
    
    setClients([...clients, clientToAdd]);
    setNewClient({ name: '', contactName: '', email: '', phone: '', sector: 'Technologie' });
    setIsAddDialogOpen(false);
    toast({
      title: "Client ajouté",
      description: "Le client a été ajouté avec succès",
    });
  };

  const handleEditClient = () => {
    if (currentClient) {
      setClients(clients.map(client => 
        client.id === currentClient.id ? currentClient : client
      ));
      setIsEditDialogOpen(false);
      toast({
        title: "Client modifié",
        description: "Le client a été modifié avec succès",
      });
    }
  };

  const handleDeleteClient = (id: number) => {
    setClients(clients.filter(client => client.id !== id));
    toast({
      title: "Client supprimé",
      description: "Le client a été supprimé avec succès",
    });
  };

  const openEditDialog = (client: any) => {
    setCurrentClient({...client});
    setIsEditDialogOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="pt-16 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-2" />
                Gestion des clients
              </h1>
              <p className="text-gray-500 mt-1">Gérez votre portefeuille de clients</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un client
            </Button>
          </div>
          
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Société</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.contactName}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.sector}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        client.status === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {client.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(client)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteClient(client.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Liste des clients</TableCaption>
            </Table>
          </div>
        </div>
      </div>

      {/* Dialog d'ajout de client */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la société</Label>
              <Input 
                id="name" 
                value={newClient.name}
                onChange={(e) => setNewClient({...newClient, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Nom du contact</Label>
              <Input 
                id="contactName" 
                value={newClient.contactName}
                onChange={(e) => setNewClient({...newClient, contactName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({...newClient, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input 
                id="phone" 
                value={newClient.phone}
                onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Secteur d'activité</Label>
              <Select 
                value={newClient.sector}
                onValueChange={(value) => setNewClient({...newClient, sector: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un secteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technologie">Technologie</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Santé">Santé</SelectItem>
                  <SelectItem value="Commerce">Commerce</SelectItem>
                  <SelectItem value="Immobilier">Immobilier</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAddClient}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification de client */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
          </DialogHeader>
          {currentClient && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom de la société</Label>
                <Input 
                  id="edit-name" 
                  value={currentClient.name}
                  onChange={(e) => setCurrentClient({...currentClient, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contactName">Nom du contact</Label>
                <Input 
                  id="edit-contactName" 
                  value={currentClient.contactName}
                  onChange={(e) => setCurrentClient({...currentClient, contactName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={currentClient.email}
                  onChange={(e) => setCurrentClient({...currentClient, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input 
                  id="edit-phone" 
                  value={currentClient.phone}
                  onChange={(e) => setCurrentClient({...currentClient, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sector">Secteur d'activité</Label>
                <Select 
                  value={currentClient.sector}
                  onValueChange={(value) => setCurrentClient({...currentClient, sector: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technologie">Technologie</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Santé">Santé</SelectItem>
                    <SelectItem value="Commerce">Commerce</SelectItem>
                    <SelectItem value="Immobilier">Immobilier</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Statut</Label>
                <Select 
                  value={currentClient.status}
                  onValueChange={(value) => setCurrentClient({...currentClient, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleEditClient}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default ComptableClients;
