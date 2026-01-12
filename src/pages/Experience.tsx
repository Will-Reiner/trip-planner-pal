import { useState, useEffect } from 'react';
import { useTripData } from '../contexts/TripDataContext';
import { useUser } from '../contexts/UserContext';
import BottomNav from '../components/BottomNav';
import { Sparkles, Music, PartyPopper, MessageCircle, Users, Send, Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Experience = () => {
  const { data, votePartyTheme, addQuote, updateParticipant } = useTripData();
  const { currentUser } = useUser();
  const [newQuote, setNewQuote] = useState('');
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const tripDate = new Date('2025-02-14T00:00:00');

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const difference = tripDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);

    return () => clearInterval(timer);
  }, []);

  const totalThemeVotes = data.partyThemes.reduce((acc, t) => acc + t.votes.length, 0);

  const handleAddQuote = () => {
    if (newQuote.trim() && currentUser) {
      addQuote(newQuote.trim(), currentUser.id);
      setNewQuote('');
    }
  };

  const handleVoteTheme = (themeId: number) => {
    if (currentUser) {
      votePartyTheme(themeId, currentUser.id);
    }
  };

  const getParticipantName = (id: number) => {
    return data.participants.find(p => p.id === id)?.name || 'Anônimo';
  };

  const handleSaveTitle = (participantId: number) => {
    if (titleInput.trim()) {
      updateParticipant(participantId, { title: titleInput.trim() });
    }
    setEditingTitle(null);
    setTitleInput('');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Countdown */}
      <div className="bg-gradient-to-r from-primary via-accent to-primary p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-primary-foreground" />
          <span className="text-sm font-medium text-primary-foreground">
            Contagem Regressiva para a Trip! 🎉
          </span>
        </div>
        <div className="flex justify-center gap-3">
          <div className="bg-background/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[60px]">
            <div className="text-2xl font-bold text-primary-foreground">{countdown.days}</div>
            <div className="text-xs text-primary-foreground/80">dias</div>
          </div>
          <div className="bg-background/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[60px]">
            <div className="text-2xl font-bold text-primary-foreground">{countdown.hours}</div>
            <div className="text-xs text-primary-foreground/80">horas</div>
          </div>
          <div className="bg-background/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[60px]">
            <div className="text-2xl font-bold text-primary-foreground">{countdown.minutes}</div>
            <div className="text-xs text-primary-foreground/80">min</div>
          </div>
          <div className="bg-background/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[60px]">
            <div className="text-2xl font-bold text-primary-foreground">{countdown.seconds}</div>
            <div className="text-xs text-primary-foreground/80">seg</div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-primary/30 to-accent p-6 pt-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Rebola's Experience</h1>
          </div>
          <p className="text-muted-foreground">
            A experiência completa! 🎊
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-8">
        {/* Spotify Embed */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Playlist da Trip</h2>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="aspect-[3/1] bg-muted rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Music className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Cole aqui o embed do Spotify
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  playlist:37i9dQZF1DXcBWIGoYBM5M
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Party Theme Voting */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <PartyPopper className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Tema da Festa</h2>
            <Badge variant="secondary">{totalThemeVotes} votos</Badge>
          </div>
          <div className="space-y-3">
            {data.partyThemes.map(theme => {
              const hasVoted = currentUser && theme.votes.includes(currentUser.id);
              const percentage = totalThemeVotes > 0
                ? (theme.votes.length / totalThemeVotes) * 100
                : 0;

              return (
                <button
                  key={theme.id}
                  onClick={() => handleVoteTheme(theme.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                    hasVoted
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{theme.emoji}</span>
                      <span className="font-medium text-foreground">{theme.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {theme.votes.length}
                      </span>
                      {hasVoted && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Quotes Wall */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Mural de Pérolas</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Registre a pérola..."
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddQuote()}
              className="flex-1"
            />
            <Button onClick={handleAddQuote} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {data.quotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma pérola ainda...</p>
                <p className="text-sm">Seja o primeiro a registrar!</p>
              </div>
            ) : (
              data.quotes.map(quote => (
                <div
                  key={quote.id}
                  className="p-4 bg-card rounded-2xl border border-border"
                >
                  <p className="text-foreground italic mb-2">"{quote.text}"</p>
                  <p className="text-sm text-muted-foreground">
                    — {getParticipantName(quote.author)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Character Panel */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Painel de Personagens</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {data.participants.map(participant => (
              <div
                key={participant.id}
                className="bg-card rounded-2xl border border-border p-3 text-center"
              >
                <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-primary/20">
                  <AvatarImage src={participant.photo || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {participant.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium text-foreground text-sm truncate">
                  {participant.name}
                </p>
                {editingTitle === participant.id ? (
                  <div className="mt-2">
                    <Input
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      placeholder="Título..."
                      className="text-xs h-7"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle(participant.id)}
                      onBlur={() => handleSaveTitle(participant.id)}
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingTitle(participant.id);
                      setTitleInput(participant.title);
                    }}
                    className="mt-1 text-xs text-muted-foreground hover:text-primary transition-colors min-h-[1.5rem]"
                  >
                    {participant.title || '+ Título engraçado'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default Experience;
