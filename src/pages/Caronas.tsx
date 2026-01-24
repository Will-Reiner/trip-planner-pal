import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTripData } from '../contexts/TripDataContext';
import BottomNav from '../components/BottomNav';
import { Car, Users, Plus, MapPin, DollarSign, Trash2, UserPlus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Ride {
  id: number;
  titulo: string;
  motorista_id: number;
  motorista_nome: string;
  origem: string;
  destino: string;
  valor_gasolina: number;
  distancia_km: number;
  data_viagem: string;
  passageiros: Array<{
    user_id: number;
    user_nome: string;
    contribuicao: number | null;
    pagamento_confirmado: boolean;
  }>;
}

const Caronas = () => {
  const { currentUser } = useUser();
  const { data } = useTripData();
  const { toast } = useToast();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [rideForm, setRideForm] = useState({
    titulo: '',
    origem: '',
    destino: '',
    valor_gasolina: '',
    distancia_km: '',
    data_viagem: '',
    passageiros: [] as Array<{ user_id: number; contribuicao: string }>,
  });

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/rides`);
      setRides(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar caronas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as caronas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRide = async () => {
    if (!rideForm.titulo || !currentUser) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título da carona',
        variant: 'destructive',
      });
      return;
    }

    // Verificar limite de 5 pessoas (motorista + passageiros)
    if (rideForm.passageiros.length >= 5) {
      toast({
        title: 'Limite excedido',
        description: 'Máximo 4 passageiros + motorista (5 pessoas total)',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.post(`${API_URL}/rides`, {
        titulo: rideForm.titulo,
        motorista_id: currentUser.id,
        origem: rideForm.origem || null,
        destino: rideForm.destino || null,
        valor_gasolina: rideForm.valor_gasolina ? parseFloat(rideForm.valor_gasolina) : null,
        distancia_km: rideForm.distancia_km ? parseFloat(rideForm.distancia_km) : null,
        data_viagem: rideForm.data_viagem || null,
        passageiros: rideForm.passageiros.map(p => ({
          user_id: p.user_id,
          contribuicao: p.contribuicao ? parseFloat(p.contribuicao) : null,
        })),
      });

      toast({ title: 'Carona criada com sucesso!' });
      setIsDialogOpen(false);
      setRideForm({
        titulo: '',
        origem: '',
        destino: '',
        valor_gasolina: '',
        distancia_km: '',
        data_viagem: '',
        passageiros: [],
      });
      loadRides();
    } catch (error) {
      console.error('Erro ao criar carona:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a carona',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRide = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/rides/${id}`);
      toast({ title: 'Carona removida!' });
      loadRides();
    } catch (error) {
      console.error('Erro ao deletar carona:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a carona',
        variant: 'destructive',
      });
    }
  };

  const handleJoinRide = async (rideId: number) => {
    if (!currentUser) return;

    try {
      await axios.post(`${API_URL}/rides/${rideId}/join`, {
        user_id: currentUser.id,
      });
      toast({ title: 'Você entrou na carona!' });
      loadRides();
    } catch (error: any) {
      console.error('Erro ao entrar na carona:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Não foi possível entrar na carona',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveRide = async (rideId: number) => {
    if (!currentUser) return;

    try {
      await axios.post(`${API_URL}/rides/${rideId}/leave`, {
        user_id: currentUser.id,
      });
      toast({ title: 'Você saiu da carona!' });
      loadRides();
    } catch (error) {
      console.error('Erro ao sair da carona:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível sair da carona',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (ride: Ride) => {
    setEditingRide(ride);
    setRideForm({
      titulo: ride.titulo,
      origem: ride.origem || '',
      destino: ride.destino || '',
      valor_gasolina: ride.valor_gasolina?.toString() || '',
      distancia_km: ride.distancia_km?.toString() || '',
      data_viagem: ride.data_viagem ? ride.data_viagem.slice(0, 16) : '',
      passageiros: ride.passageiros.map(p => ({
        user_id: p.user_id,
        contribuicao: p.contribuicao?.toString() || '',
      })),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateRide = async () => {
    if (!editingRide || !rideForm.titulo) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título da carona',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.patch(`${API_URL}/rides/${editingRide.id}`, {
        titulo: rideForm.titulo,
        origem: rideForm.origem || null,
        destino: rideForm.destino || null,
        valor_gasolina: rideForm.valor_gasolina ? parseFloat(rideForm.valor_gasolina) : null,
        distancia_km: rideForm.distancia_km ? parseFloat(rideForm.distancia_km) : null,
        data_viagem: rideForm.data_viagem || null,
        passageiros: rideForm.passageiros.map(p => ({
          user_id: p.user_id,
          contribuicao: p.contribuicao ? parseFloat(p.contribuicao) : null,
        })),
      });

      toast({ title: 'Carona atualizada com sucesso!' });
      setIsEditDialogOpen(false);
      setEditingRide(null);
      setRideForm({
        titulo: '',
        origem: '',
        destino: '',
        valor_gasolina: '',
        distancia_km: '',
        data_viagem: '',
        passageiros: [],
      });
      loadRides();
    } catch (error) {
      console.error('Erro ao atualizar carona:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a carona',
        variant: 'destructive',
      });
    }
  };

  const togglePassenger = (userId: number) => {
    setRideForm(prev => {
      const exists = prev.passageiros.find(p => p.user_id === userId);
      if (exists) {
        return {
          ...prev,
          passageiros: prev.passageiros.filter(p => p.user_id !== userId),
        };
      } else {
        // Verificar limite de 4 passageiros
        if (prev.passageiros.length >= 4) {
          toast({
            title: 'Limite atingido',
            description: 'Máximo 4 passageiros por carro',
            variant: 'destructive',
          });
          return prev;
        }
        return {
          ...prev,
          passageiros: [...prev.passageiros, { user_id: userId, contribuicao: '' }],
        };
      }
    });
  };

  const availablePassengers = data.participants.filter(p => p.id !== currentUser?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando caronas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 to-accent p-6 pt-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Car className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Caronas</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Organize as caronas da viagem (máx. 5 pessoas por carro)
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Botão de Nova Carona */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Oferecer Carona
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Oferecer Carona</DialogTitle>
              <DialogDescription>
                Crie uma carona e convide passageiros (máx. 4 passageiros + você)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={rideForm.titulo}
                  onChange={(e) => setRideForm({ ...rideForm, titulo: e.target.value })}
                  placeholder="Ex: Ida para a praia"
                />
              </div>
              <div>
                <Label>Origem</Label>
                <Input
                  value={rideForm.origem}
                  onChange={(e) => setRideForm({ ...rideForm, origem: e.target.value })}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div>
                <Label>Destino</Label>
                <Input
                  value={rideForm.destino}
                  onChange={(e) => setRideForm({ ...rideForm, destino: e.target.value })}
                  placeholder="Ex: Praia Grande"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gasolina (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rideForm.valor_gasolina}
                    onChange={(e) => setRideForm({ ...rideForm, valor_gasolina: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Distância (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={rideForm.distancia_km}
                    onChange={(e) => setRideForm({ ...rideForm, distancia_km: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Data da Viagem</Label>
                <Input
                  type="datetime-local"
                  value={rideForm.data_viagem}
                  onChange={(e) => setRideForm({ ...rideForm, data_viagem: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-2 block">
                  Passageiros ({rideForm.passageiros.length}/4)
                </Label>
                <div className="space-y-2">
                  {availablePassengers.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`passenger-${p.id}`}
                        checked={rideForm.passageiros.some(pass => pass.user_id === p.id)}
                        onCheckedChange={() => togglePassenger(p.id)}
                        disabled={!rideForm.passageiros.some(pass => pass.user_id === p.id) && rideForm.passageiros.length >= 4}
                      />
                      <Label htmlFor={`passenger-${p.id}`} className="flex-1">{p.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRide}>Criar Carona</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Carona</DialogTitle>
              <DialogDescription>
                Atualize os detalhes da carona
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={rideForm.titulo}
                  onChange={(e) => setRideForm({ ...rideForm, titulo: e.target.value })}
                  placeholder="Ex: Ida para a praia"
                />
              </div>
              <div>
                <Label>Origem</Label>
                <Input
                  value={rideForm.origem}
                  onChange={(e) => setRideForm({ ...rideForm, origem: e.target.value })}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div>
                <Label>Destino</Label>
                <Input
                  value={rideForm.destino}
                  onChange={(e) => setRideForm({ ...rideForm, destino: e.target.value })}
                  placeholder="Ex: Praia Grande"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gasolina (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rideForm.valor_gasolina}
                    onChange={(e) => setRideForm({ ...rideForm, valor_gasolina: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Distância (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={rideForm.distancia_km}
                    onChange={(e) => setRideForm({ ...rideForm, distancia_km: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Data da Viagem</Label>
                <Input
                  type="datetime-local"
                  value={rideForm.data_viagem}
                  onChange={(e) => setRideForm({ ...rideForm, data_viagem: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-2 block">
                  Passageiros ({rideForm.passageiros.length}/4)
                </Label>
                <div className="space-y-2">
                  {availablePassengers.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`edit-passenger-${p.id}`}
                        checked={rideForm.passageiros.some(pass => pass.user_id === p.id)}
                        onCheckedChange={() => togglePassenger(p.id)}
                        disabled={!rideForm.passageiros.some(pass => pass.user_id === p.id) && rideForm.passageiros.length >= 4}
                      />
                      <Label htmlFor={`edit-passenger-${p.id}`} className="flex-1">{p.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateRide}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lista de Caronas */}
        {rides.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhuma carona disponível</p>
            <p className="text-sm text-muted-foreground">Seja o primeiro a oferecer!</p>
          </div>
        ) : (
          rides.map(ride => {
            const isDriver = ride.motorista_id === currentUser?.id;
            const passageiros = ride.passageiros || [];
            const isPassenger = passageiros.some(p => p.user_id === currentUser?.id);
            const availableSeats = 4 - passageiros.length;
            const isFull = availableSeats <= 0;

            return (
              <div key={ride.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg">{ride.titulo}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Motorista: {ride.motorista_nome}</span>
                    </div>
                  </div>
                  {isDriver && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(ride)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRide(ride.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Informações */}
                {(ride.origem || ride.destino) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {ride.origem && ride.destino 
                        ? `${ride.origem} → ${ride.destino}`
                        : ride.origem || ride.destino
                      }
                    </span>
                  </div>
                )}

                {ride.valor_gasolina && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-600">
                      Gasolina: R$ {parseFloat(ride.valor_gasolina.toString()).toFixed(2)}
                      {ride.distancia_km && ` (${ride.distancia_km}km)`}
                    </span>
                  </div>
                )}

                {/* Passageiros */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Passageiros ({passageiros.length}/4)
                    </span>
                    <Badge variant={isFull ? 'destructive' : 'secondary'}>
                      {isFull ? 'Lotado' : `${availableSeats} vagas`}
                    </Badge>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {passageiros.map(p => (
                      <Badge key={p.user_id} variant="outline" className="text-xs">
                        {p.user_nome}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                {!isDriver && (
                  <div className="pt-2 border-t">
                    {isPassenger ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleLeaveRide(ride.id)}
                      >
                        Sair da Carona
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleJoinRide(ride.id)}
                        disabled={isFull}
                      >
                        <UserPlus className="w-4 h-4" />
                        {isFull ? 'Carona Lotada' : 'Entrar na Carona'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Caronas;
