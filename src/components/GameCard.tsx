import { useState } from 'react';
import { useTripData } from '../contexts/TripDataContext';
import { useUser } from '../contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trophy, Plus, QrCode, ExternalLink } from 'lucide-react';
import { getUserColor } from '../lib/userColors';
import { createQRCode, getQRCodes, type QRCode as QRCodeType } from '../services/api';
import { useToast } from '@/hooks/use-toast';

export const GameCard = () => {
  const { data, addGamePoint } = useTripData();
  const { currentUser } = useUser();
  const { toast } = useToast();
  
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCodes, setQrCodes] = useState<QRCodeType[]>([]);
  const [newToken, setNewToken] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loadingQRCodes, setLoadingQRCodes] = useState(false);
  
  const isLumi = currentUser?.name === 'Lumi';
  
  const loadQRCodes = async () => {
    try {
      setLoadingQRCodes(true);
      const codes = await getQRCodes();
      setQrCodes(codes);
    } catch (error) {
      toast({
        title: 'Erro ao carregar QR codes',
        variant: 'destructive',
      });
    } finally {
      setLoadingQRCodes(false);
    }
  };
  
  const handleCreateQRCode = async () => {
    if (!newToken.trim()) {
      toast({
        title: 'Token obrigatório',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await createQRCode(newToken.trim(), newDescription.trim() || undefined);
      toast({
        title: 'QR code criado!',
        description: `Token: ${newToken}`,
      });
      setNewToken('');
      setNewDescription('');
      loadQRCodes();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erro ao criar QR code';
      toast({
        title: errorMessage,
        variant: 'destructive',
      });
    }
  };
  
  const openQRDialog = () => {
    setShowQRDialog(true);
    loadQRCodes();
  };
  
  // Para usuário Lumi: mostrar painel administrativo
  if (isLumi) {
    return (
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              <CardTitle className="text-2xl font-bold">Joguinho da Lumi</CardTitle>
            </div>
            <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openQRDialog}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerenciar QR Codes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Gerenciar QR Codes</DialogTitle>
                  <DialogDescription>
                    Crie novos tokens para QR codes. Apenas tokens criados aqui serão válidos.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold mb-3">Criar Novo QR Code</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="token">Token (obrigatório)</Label>
                        <Input
                          id="token"
                          placeholder="ex: qrcode-alpha, desafio-1, missao-secreta"
                          value={newToken}
                          onChange={(e) => setNewToken(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Descrição (opcional)</Label>
                        <Input
                          id="description"
                          placeholder="ex: QR code da entrada, Desafio da cozinha"
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleCreateQRCode} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Criar QR Code
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">QR Codes Criados</h3>
                    {loadingQRCodes ? (
                      <p className="text-center text-muted-foreground py-4">Carregando...</p>
                    ) : qrCodes.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">Nenhum QR code criado ainda</p>
                    ) : (
                      <div className="space-y-2">
                        {qrCodes.map((qr) => (
                          <div
                            key={qr.id}
                            className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-mono font-semibold">{qr.token}</p>
                                {qr.descricao && (
                                  <p className="text-sm text-muted-foreground">{qr.descricao}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className={qr.ativo ? 'text-green-600' : 'text-red-600'}>
                                    {qr.ativo ? '✓ Ativo' : '✗ Inativo'}
                                  </span>
                                  <span>{qr.usado_count} {qr.usado_count === 1 ? 'uso' : 'usos'}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const url = `${window.location.origin}/game/qr/${qr.token}`;
                                  navigator.clipboard.writeText(url);
                                  toast({ title: 'URL copiada!' });
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowQRDialog(false)}>
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
