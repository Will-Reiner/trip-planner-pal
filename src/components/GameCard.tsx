import { useTripData } from '../contexts/TripDataContext';
import { useUser } from '../contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trophy, Plus } from 'lucide-react';
import { getUserColor } from '../lib/userColors';

export const GameCard = () => {
  const { data, addGamePoint } = useTripData();
  const { currentUser } = useUser();
  
  const isLumi = currentUser?.name === 'Lumi';
  
  // Para usuário Lumi: mostrar painel administrativo
  if (isLumi) {
    return (
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            <CardTitle className="text-2xl font-bold">Joguinho da Lumi</CardTitle>
          </div>
          <CardDescription className="text-purple-100">
            Painel de pontuação - Gerenciar pontos dos jogadores
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {data.gameLeaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum jogador ainda
              </p>
            ) : (
              data.gameLeaderboard.map((player, index) => {
                const color = getUserColor(player.id);
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                        {index + 1}°
                      </div>
                      <Avatar className="w-10 h-10 border-2" style={{ borderColor: color }}>
                        <AvatarImage src={player.avatar_url || undefined} />
                        <AvatarFallback style={{ backgroundColor: color + '20', color: color }}>
                          {player.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{player.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {player.total_acoes} {player.total_acoes === 1 ? 'ação' : 'ações'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <p className="text-2xl font-bold text-purple-600">
                            {player.total_pontos}
                          </p>
                          <p className="text-xs text-muted-foreground">pontos</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addGamePoint(player.id)}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          +1
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Para usuários normais: mostrar sua pontuação
  const myScore = data.myGameScore;
  const myPosition = data.gameLeaderboard.findIndex(p => p.id === currentUser?.id) + 1;
  
  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          <CardTitle className="text-2xl font-bold">Sua Pontuação dos Games</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {myScore ? (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
              <span className="text-4xl font-bold text-white">
                {myScore.total_pontos}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {myScore.total_pontos} {myScore.total_pontos === 1 ? 'Ponto' : 'Pontos'}
              </p>
              {myPosition > 0 && (
                <p className="text-muted-foreground">
                  Você está em {myPosition}° lugar
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {myScore.total_acoes} {myScore.total_acoes === 1 ? 'ação completada' : 'ações completadas'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Você ainda não pontuou nenhum desafio
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Escaneie QR codes para ganhar pontos!
            </p>
          </div>
        )}
        
        {data.gameLeaderboard.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-3 text-center">Ranking Geral</h3>
            <div className="space-y-2">
              {data.gameLeaderboard.slice(0, 5).map((player, index) => {
                const isCurrentUser = player.id === currentUser?.id;
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      isCurrentUser ? 'bg-primary/10 border border-primary' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold w-6">
                        {index + 1}°
                      </span>
                      <span className="text-sm">
                        {player.nome}
                        {isCurrentUser && ' (você)'}
                      </span>
                    </div>
                    <span className="font-bold text-purple-600">
                      {player.total_pontos}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
