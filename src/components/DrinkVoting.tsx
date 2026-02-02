import { useState } from 'react';
import { useTripData } from '../contexts/TripDataContext';
import { useUser } from '../contexts/UserContext';
import { UserPlus, UserMinus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DrinkVotingProps {
  type: 'alcoholic' | 'nonAlcoholic';
  drinks: {
    id: number;
    name: string;
    emoji: string;
    createdBy: string | null;
    createdById: number | null;
    participants: { userId: number; userName: string }[];
  }[];
}

const DrinkVoting: React.FC<DrinkVotingProps> = ({ type, drinks }) => {
  const { joinDrink, leaveDrink, deleteDrink } = useTripData();
  const { currentUser, isAdmin } = useUser();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [drinkToDelete, setDrinkToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleJoinLeave = async (drinkId: number, isParticipant: boolean) => {
    if (!currentUser) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado',
        variant: 'destructive',
      });
      return;
    }

    // Salvar posição do scroll antes de recarregar
    const scrollPosition = window.scrollY;
    sessionStorage.setItem('gastronomia_scroll_position', scrollPosition.toString());

    if (isParticipant) {
      await leaveDrink(drinkId, currentUser.id);
    } else {
      await joinDrink(drinkId, currentUser.id);
    }

    // Restaurar posição do scroll após recarregar
    setTimeout(() => {
      const savedPosition = sessionStorage.getItem('gastronomia_scroll_position');
      if (savedPosition) {
        window.scrollTo(0, parseInt(savedPosition));
        sessionStorage.removeItem('gastronomia_scroll_position');
      }
    }, 100);
  };

  const handleDeleteClick = (drinkId: number) => {
    setDrinkToDelete(drinkId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!drinkToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteDrink(drinkToDelete);
      setDeleteDialogOpen(false);
      setDrinkToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (drinks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg mb-2">Nenhuma bebida cadastrada ainda</p>
        <p className="text-sm">Seja o primeiro a adicionar uma bebida! 🍹</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {drinks.map(drink => {
          const isParticipant = currentUser && drink.participants.some(p => p.userId === currentUser.id);
          const canDelete = currentUser && (isAdmin() || drink.createdById === currentUser.id);
          
          return (
            <div
              key={drink.id}
              className="bg-card rounded-2xl border-2 border-border p-4 transition-all duration-200 hover:shadow-md"
            >
              {/* Header com emoji, nome e botão deletar */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{drink.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{drink.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Criado por: {drink.createdBy || 'Desconhecido'}
                    </p>
                  </div>
                </div>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(drink.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Lista de participantes */}
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Dentro ({drink.participants.length}):
                </p>
                {drink.participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Ninguém ainda</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {drink.participants.map(participant => (
                      <Badge key={participant.userId} variant="secondary">
                        {participant.userName}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão de entrar/sair */}
              {currentUser && (
                <Button
                  onClick={() => handleJoinLeave(drink.id, isParticipant)}
                  className="w-full"
                  variant={isParticipant ? "outline" : "default"}
                >
                  {isParticipant ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Não quero
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Quero Entrar!
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar bebida?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A bebida e todos os participantes do racha serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DrinkVoting;
