import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { User, LogOut, Camera, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Perfil = () => {
  const { currentUser, setCurrentUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentUser({
          ...currentUser,
          photo: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 to-accent p-6 pt-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Profile Card */}
        <div className="bg-card rounded-3xl border border-border p-8 text-center mb-6">
          <label className="relative inline-block cursor-pointer group">
            <Avatar className="w-32 h-32 border-4 border-primary/20 transition-transform group-hover:scale-105">
              <AvatarImage src={currentUser?.photo || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
                {currentUser?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-2 right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Camera className="w-5 h-5 text-primary-foreground" />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>

          <h2 className="text-2xl font-bold text-foreground mt-4">
            {currentUser?.name}
          </h2>
          <p className="text-muted-foreground mt-1">
            Participante da Trip 🌴
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-2xl font-bold text-foreground">4</p>
            <p className="text-sm text-muted-foreground">Dias de Trip</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-2xl font-bold text-foreground">15</p>
            <p className="text-sm text-muted-foreground">Participantes</p>
          </div>
        </div>

        {/* Fun Message */}
        <div className="bg-primary/10 rounded-2xl p-6 text-center mb-6">
          <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-foreground font-medium">
            Bora fazer essa trip inesquecível! 🚀
          </p>
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-14 text-lg font-semibold rounded-2xl"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Trocar de Usuário
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Perfil;
