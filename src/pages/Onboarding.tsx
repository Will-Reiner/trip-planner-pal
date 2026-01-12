import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTripData } from '../contexts/TripDataContext';
import { Camera, PartyPopper, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Onboarding = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();
  const { data } = useTripData();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = () => {
    if (selectedId) {
      const participant = data.participants.find(p => p.id === selectedId);
      if (participant) {
        setCurrentUser({
          id: participant.id,
          name: participant.name,
          photo: photo
        });
        navigate('/gastronomia');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <PartyPopper className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Rebola's Trip 🎉
          </h1>
          <p className="text-muted-foreground">
            Quem é você nessa aventura?
          </p>
        </div>

        {/* Photo Upload */}
        <div className="flex justify-center mb-8">
          <label className="relative cursor-pointer group">
            <Avatar className="w-24 h-24 border-4 border-primary/20 transition-transform group-hover:scale-105">
              <AvatarImage src={photo || undefined} />
              <AvatarFallback className="bg-primary/10">
                <Camera className="w-8 h-8 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Participants List */}
        <div className="space-y-3 mb-8">
          {data.participants.map((participant, index) => (
            <button
              key={participant.id}
              onClick={() => setSelectedId(participant.id)}
              className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                selectedId === participant.id
                  ? 'border-primary bg-primary/10 scale-[1.02]'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                selectedId === participant.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {participant.name.charAt(0)}
              </div>
              <span className="font-medium text-foreground flex-1 text-left">
                {participant.name}
              </span>
              {selectedId === participant.id && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedId}
          className="w-full h-14 text-lg font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50"
          size="lg"
        >
          Bora lá! 🚀
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
