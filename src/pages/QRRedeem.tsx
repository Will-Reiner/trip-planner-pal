import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { redeemQRCode } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const QRRedeem = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Token inválido');
      setLoading(false);
      return;
    }

    const redeem = async () => {
      try {
        const result = await redeemQRCode(token);
        setSuccess(true);
        toast({
          title: result.message || '+1 ponto! 🎉',
          description: 'Parabéns! Você ganhou um ponto!',
        });
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Erro ao resgatar QR code';
        setError(errorMessage);
        toast({
          title: 'Ops!',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    redeem();
  }, [token, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {loading ? (
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : success ? (
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {loading ? 'Processando...' : success ? 'Sucesso!' : 'Oops!'}
          </CardTitle>
          <CardDescription>
            {loading
              ? 'Estamos processando seu QR code'
              : success
              ? 'Você ganhou um ponto!'
              : error || 'Algo deu errado'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {success && (
            <div className="py-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <p className="text-4xl font-bold text-purple-600 mb-2">+1</p>
              <p className="text-muted-foreground">Ponto adicionado à sua conta!</p>
            </div>
          )}
          
          {error && (
            <div className="py-4">
              <p className="text-lg text-muted-foreground mb-4">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => navigate('/experience')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Ver Pontuação
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRRedeem;
