import { useState, useEffect } from 'react';
import { useTripData } from '../contexts/TripDataContext';
import { useUser } from '../contexts/UserContext';
import BottomNav from '../components/BottomNav';
import { GameCard } from '../components/GameCard';
import { Sparkles, Music, PartyPopper, MessageCircle, Users, Send, Check, Calendar, Sun, Sunset, Moon, Plus, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Schedule Component
const ScheduleView = () => {
  return (
    <div className="bg-card rounded-2xl border border-border p-8 text-center">
      <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
      <p className="text-lg font-medium text-muted-foreground mb-2">Em breve...</p>
      <p className="text-sm text-muted-foreground">Cronograma detalhado será divulgado em breve!</p>
    </div>
  );
};

const Experience = () => {
  const { data, votePartyTheme, removeVotePartyTheme, addPartyTheme, deletePartyTheme, addQuote, updateParticipant } = useTripData();
  const { currentUser } = useUser();
  const [newQuote, setNewQuote] = useState('');
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [newTheme, setNewTheme] = useState({ nome: '', descricao: '', cor_card: '#8b5cf6' });

  const tripDate = new Date('2026-02-14T00:00:00'); // Data da trip

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

  const handleAddQuote = () => {
    if (newQuote.trim() && currentUser) {
      addQuote(newQuote.trim(), currentUser.id);
      setNewQuote('');
    }
  };

  const handleAddTheme = () => {
    if (newTheme.nome.trim()) {
      addPartyTheme(newTheme.nome, newTheme.descricao, newTheme.cor_card);
      setNewTheme({ nome: '', descricao: '', cor_card: '#8b5cf6' });
      setShowThemeDialog(false);
    }
  };

  const handleVoteTheme = (themeId: number, voteType: 'positive' | 'negative') => {
    if (!currentUser) return;
    
    const theme = data.partyThemes.find(t => t.id === themeId);
    if (!theme) return;

    // Se já votou no mesmo tipo, remove o voto
    if (theme.userVote === voteType) {
      removeVotePartyTheme(themeId);
    } else {
      // Senão, adiciona ou altera o voto
      votePartyTheme(themeId, voteType);
    }
  };

  const handleDeleteTheme = (themeId: number) => {
    if (confirm('Tem certeza que deseja deletar este tema?')) {
      deletePartyTheme(themeId);
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
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/30 to-accent p-6 pt-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Rebola's Experience</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-8">
        {/* Countdown */}
        <section className="space-y-3">
          <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-3xl p-6 text-center shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-white" />
              <span className="text-lg font-bold text-white">
                Contagem Regressiva para a Trip! 🎉
              </span>
            </div>
            <div className="flex justify-center gap-2 mb-2">
              <div className="bg-white/30 backdrop-blur-md rounded-2xl px-4 py-3 min-w-[70px] border-2 border-white/40">
                <div className="text-4xl font-black text-white drop-shadow-lg">{countdown.days}</div>
                <div className="text-sm font-semibold text-white/90">dias</div>
              </div>
              <div className="bg-white/30 backdrop-blur-md rounded-2xl px-4 py-3 min-w-[70px] border-2 border-white/40">
                <div className="text-4xl font-black text-white drop-shadow-lg">{countdown.hours}</div>
                <div className="text-sm font-semibold text-white/90">horas</div>
              </div>
              <div className="bg-white/30 backdrop-blur-md rounded-2xl px-4 py-3 min-w-[70px] border-2 border-white/40">
                <div className="text-4xl font-black text-white drop-shadow-lg">{countdown.minutes}</div>
                <div className="text-sm font-semibold text-white/90">min</div>
              </div>
              <div className="bg-white/30 backdrop-blur-md rounded-2xl px-4 py-3 min-w-[70px] border-2 border-white/40">
                <div className="text-4xl font-black text-white drop-shadow-lg">{countdown.seconds}</div>
                <div className="text-sm font-semibold text-white/90">seg</div>
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mt-3">
              14 de Fevereiro de 2026 🏖️
            </p>
          </div>
        </section>

        {/* Party Theme Voting */}
        <section className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Festas</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Lembrando que teremos 3 noites de curtição!
              </p>
            </div>
            <Dialog open={showThemeDialog} onOpenChange={setShowThemeDialog}>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Tema</DialogTitle>
                  <DialogDescription>
                    Sugira um tema para as festas da viagem!
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Tema</Label>
                    <Input
                      id="nome"
                      value={newTheme.nome}
                      onChange={(e) => setNewTheme({ ...newTheme, nome: e.target.value })}
                      placeholder="Ex: Anos 80, Neon, Tropical..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição/Ideias</Label>
                    <Textarea
                      id="descricao"
                      value={newTheme.descricao}
                      onChange={(e) => setNewTheme({ ...newTheme, descricao: e.target.value })}
                      placeholder="Descreva o tema e dê ideias de roupas, decoração..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cor">Cor do Card</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        id="cor"
                        value={newTheme.cor_card}
                        onChange={(e) => setNewTheme({ ...newTheme, cor_card: e.target.value })}
                        className="h-10 w-20 rounded cursor-pointer"
                      />
                      <Input
                        value={newTheme.cor_card}
                        onChange={(e) => setNewTheme({ ...newTheme, cor_card: e.target.value })}
                        placeholder="#8b5cf6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowThemeDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddTheme}>
                    Criar Tema
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-3">
            {data.partyThemes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PartyPopper className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum tema ainda...</p>
                <p className="text-sm">Seja o primeiro a sugerir!</p>
              </div>
            ) : (
              data.partyThemes.map(theme => {
                const totalVotes = theme.positive_votes + theme.negative_votes;
                const positivePercentage = totalVotes > 0 
                  ? (theme.positive_votes / totalVotes) * 100 
                  : 0;
                const negativePercentage = totalVotes > 0 
                  ? (theme.negative_votes / totalVotes) * 100 
                  : 0;

                return (
                  <div
                    key={theme.id}
                    className="rounded-2xl border-2 border-border overflow-hidden transition-all duration-200"
                    style={{ 
                      backgroundColor: `${theme.cor_card}15`,
                      borderColor: theme.cor_card
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-foreground mb-1">
                            {theme.nome}
                          </h3>
                          {theme.descricao && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {theme.descricao}
                            </p>
                          )}
                          {theme.autor_nome && (
                            <p className="text-xs text-muted-foreground">
                              Sugerido por {theme.autor_nome}
                            </p>
                          )}
                        </div>
                        {currentUser && (currentUser.role === 'admin' || theme.autor_id === currentUser.id) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteTheme(theme.id)}
                            className="ml-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Vote Bars */}
                      <div className="space-y-2 mb-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">👍 Curtidas</span>
                            <span className="font-medium">{theme.positive_votes} votos</span>
                          </div>
                          <Progress 
                            value={positivePercentage} 
                            className="h-2"
                            style={{ 
                              '--progress-background': theme.cor_card 
                            } as React.CSSProperties}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">👎 Não curti</span>
                            <span className="font-medium">{theme.negative_votes} votos</span>
                          </div>
                          <Progress 
                            value={negativePercentage} 
                            className="h-2 bg-destructive/20"
                          />
                        </div>
                      </div>

                      {/* Vote Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={theme.userVote === 'positive' ? 'default' : 'outline'}
                          onClick={() => handleVoteTheme(theme.id, 'positive')}
                          className="flex-1"
                          style={theme.userVote === 'positive' ? {
                            backgroundColor: theme.cor_card,
                            borderColor: theme.cor_card
                          } : {}}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          To dentro
                        </Button>
                        <Button
                          size="sm"
                          variant={theme.userVote === 'negative' ? 'destructive' : 'outline'}
                          onClick={() => handleVoteTheme(theme.id, 'negative')}
                          className="flex-1"
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          Não gostei
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Game Scoring */}
        <section className="space-y-3">
          <GameCard />
        </section>

        {/* Schedule (Cronograma) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Cronograma</h2>
          </div>
          <ScheduleView />
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

        {/* Spotify Embed */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Playlist da Trip</h2>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <iframe 
              src="https://open.spotify.com/embed/playlist/3v4KHoOj2ac4XmaQy4hMPQ?utm_source=generator" 
              width="100%" 
              height="352" 
              frameBorder="0" 
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              className="rounded-2xl"
            ></iframe>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default Experience;
