import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Upload, 
  Download, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff,
  FileText,
  AlertTriangle,
  CheckCircle,
  FileIcon
} from 'lucide-react';
import { 
  encryptFile, 
  decryptFile, 
  isEncryptedFile, 
  downloadBlob, 
  formatFileSize 
} from '@/lib/crypto';
import cryptoHero from '@/assets/crypto-hero.jpg';

interface FileInfo {
  file: File;
  size: string;
  type: string;
}

export default function CryptoApp() {
  // Estados do componente
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Refs e hooks
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  

  
  // Função para simular progresso
  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90; // Não chegar a 100% até terminar
      setProgress(progress);
    }, 300);
    
    return interval;
  };
  
  // Função para limpar o formulário
  const resetForm = () => {
    setSelectedFile(null);
    setPassword('');
    setError(null);
    setSuccess(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Manipulador de seleção de arquivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile({
        file,
        size: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
      });
      setError(null);
      setSuccess(null);
    } else {
      setSelectedFile(null);
    }
  };
  
  // Função para lidar com a criptografia
  const handleEncrypt = async () => {
    if (!selectedFile) {
      setError('Por favor, selecione um arquivo');
      return;
    }

    if (!password) {
      setError('Por favor, digite uma senha para criptografar o arquivo');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    const progressInterval = simulateProgress();

    try {
      const result = await encryptFile(selectedFile.file, password);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      downloadBlob(result.blob, result.filename);
      
      toast({
        title: "Criptografia concluída",
        description: "O download foi iniciado. A página será recarregada.",
      });
      
      // Recarrega a página para limpar o estado
      setTimeout(() => window.location.reload(), 2000);
      
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Erro na criptografia';
      setError(errorMessage);
      
      toast({
        title: "Erro na criptografia",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };
  
  // Função para lidar com a descriptografia
  const handleDecrypt = async () => {
    if (!selectedFile) {
      setError('Por favor, selecione um arquivo .enc');
      return;
    }

    if (!password) {
      setError('Por favor, digite a senha para descriptografar o arquivo');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    const progressInterval = simulateProgress();

    try {
      // Verifica novamente se o arquivo está criptografado
      const encrypted = await isEncryptedFile(selectedFile.file);
      if (!encrypted) {
        throw new Error('O arquivo selecionado não é um arquivo criptografado válido');
      }
      
      const result = await decryptFile(selectedFile.file, password);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      downloadBlob(result.blob, result.filename);
      
      toast({
        title: "Descriptografia concluída",
        description: "O download foi iniciado. A página será recarregada.",
      });
      
      // Recarrega a página para limpar o estado
      setTimeout(() => window.location.reload(), 2000);
      
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Erro na descriptografia';
      setError(errorMessage);
      
      toast({
        title: "Erro na descriptografia",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Seção Hero */}
        <div className="relative mb-12 overflow-hidden rounded-xl">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${cryptoHero})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-background" />
          <div className="relative text-center py-16 px-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className="w-12 h-12 text-primary" />
              <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                CryptoFile
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Proteja seus arquivos com criptografia AES-256. 
              Simples, seguro e completamente offline.
            </p>
          </div>
        </div>

        {/* Card Principal */}
        <Card className="backdrop-blur-sm bg-gradient-card border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Criptografar / Descriptografar Arquivo
            </CardTitle>
            <CardDescription>
              Selecione um arquivo, digite a senha e escolha a ação desejada.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Seleção de Arquivo */}
            <div className="space-y-2">
              <Label htmlFor="file-input">Selecionar Arquivo</Label>
              <div className="relative">
                <Input
                  id="file-input"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  disabled={isFileLoading || processing}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                <Upload className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{selectedFile.file.name}</span>
                  <Badge variant="outline" className="ml-auto">
                    {selectedFile.size}
                  </Badge>
                </div>
              )}
            </div>

            {/* Campo de Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                  className="pr-10"
                  disabled={processing}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={processing}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Sua senha é usada para proteger ou acessar o arquivo.
              </p>
            </div>

            {/* Barra de Progresso */}
            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Processando...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Mensagem de Erro */}
            {error && (
              <Alert variant="destructive" className="border-destructive/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Mensagem de Sucesso */}
            {success && (
              <Alert className="border-success bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">{success}</AlertDescription>
              </Alert>
            )}

            {/* Botões de Ação */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={handleEncrypt}
                disabled={!selectedFile || !password || processing}
                size="lg"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Criptografar
                  </>
                )}
              </Button>
              <Button
                onClick={handleDecrypt}
                disabled={!selectedFile || !password || processing}
                size="lg"
                variant="secondary"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Descriptografar
                  </>
                )}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                disabled={processing}
                className="col-span-2 md:col-span-1"
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Segurança */}
        <div className="mt-8 p-4 bg-secondary/30 rounded-lg border">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Como funciona</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Seus arquivos são criptografados diretamente no seu navegador usando o algoritmo AES-256, 
                  um dos mais seguros disponíveis atualmente.
                </p>
                <p>
                  <strong>Importante:</strong> Nunca compartilhe sua senha. Sem ela, não é possível recuperar 
                  os arquivos criptografados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
