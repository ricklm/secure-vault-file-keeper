import React, { useState, useRef } from 'react';
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
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile({
        file,
        size: formatFileSize(file.size),
        type: file.type || 'application/octet-stream'
      });
      setError(null);
      setSuccess(null);
    }
  };

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

  const simulateProgress = () => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 90) {
        clearInterval(interval);
        setProgress(90);
      } else {
        setProgress(currentProgress);
      }
    }, 200);
    return interval;
  };

  const handleEncrypt = async () => {
    if (!selectedFile || !password) {
      setError('Por favor, selecione um arquivo e digite uma senha');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
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
      
      setSuccess(`Arquivo criptografado com sucesso! Download iniciado: ${result.filename}`);
      
      toast({
        title: "Criptografia concluída",
        description: "Arquivo criptografado e pronto para download",
      });
      
      // Reset form after success
      setTimeout(resetForm, 3000);
      
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

  const handleDecrypt = async () => {
    if (!selectedFile || !password) {
      setError('Por favor, selecione um arquivo .enc e digite a senha');
      return;
    }

    if (!isEncryptedFile(selectedFile.file)) {
      setError('Por favor, selecione um arquivo criptografado (.enc)');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    const progressInterval = simulateProgress();

    try {
      const result = await decryptFile(selectedFile.file, password);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      downloadBlob(result.blob, result.filename);
      
      setSuccess(`Arquivo descriptografado com sucesso! Download iniciado: ${result.filename}`);
      
      toast({
        title: "Descriptografia concluída",
        description: "Arquivo descriptografado e pronto para download",
      });
      
      // Reset form after success
      setTimeout(resetForm, 3000);
      
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

  const isEncrypted = selectedFile && isEncryptedFile(selectedFile.file);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Hero Section */}
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
              Proteja seus arquivos com criptografia militar AES-256. 
              Simples, seguro e completamente offline.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <Shield className="w-4 h-4 text-primary" />
                <span>AES-256-GCM</span>
              </div>
              <div className="flex items-center gap-2 bg-success/10 px-4 py-2 rounded-full">
                <Lock className="w-4 h-4 text-success" />
                <span>100% Offline</span>
              </div>
              <div className="flex items-center gap-2 bg-crypto-accent/10 px-4 py-2 rounded-full">
                <FileIcon className="w-4 h-4 text-crypto-accent" />
                <span>Qualquer Arquivo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-sm bg-gradient-card border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isEncrypted ? (
                <>
                  <Unlock className="w-5 h-5 text-warning" />
                  Descriptografar Arquivo
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-primary" />
                  Criptografar Arquivo
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isEncrypted 
                ? "Selecione um arquivo .enc e digite a senha para descriptografar"
                : "Selecione um arquivo e defina uma senha forte para criptografar"
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* File Selection */}
            <div className="space-y-2">
              <Label htmlFor="file-input">Selecionar Arquivo</Label>
              <div className="relative">
                <Input
                  id="file-input"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  accept={isEncrypted ? ".enc" : "*"}
                />
                <Upload className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              
              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                  <FileIcon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedFile.size}</p>
                  </div>
                  <Badge variant={isEncrypted ? "secondary" : "outline"}>
                    {isEncrypted ? "Criptografado" : "Original"}
                  </Badge>
                </div>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">
                {isEncrypted ? "Senha para Descriptografar" : "Senha para Criptografar"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEncrypted ? "Digite a senha usada na criptografia" : "Digite uma senha forte (min. 8 caracteres)"}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              
              {!isEncrypted && password && (
                <div className="text-xs text-muted-foreground">
                  Força da senha: {password.length < 8 ? "Fraca" : password.length < 12 ? "Média" : "Forte"}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{isEncrypted ? "Descriptografando..." : "Criptografando..."}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="border-success bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">{success}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={isEncrypted ? handleDecrypt : handleEncrypt}
                disabled={!selectedFile || !password || processing}
                className="flex-1"
                size="lg"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                    Processando...
                  </>
                ) : isEncrypted ? (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Descriptografar
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Criptografar
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetForm}
                variant="outline"
                disabled={processing}
                size="lg"
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-secondary/30 rounded-lg">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Especificações de Segurança
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>AES-256-GCM com chaves de 256 bits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Derivação de chave PBKDF2 com 100.000 iterações</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Processamento 100% local e offline</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Chaves nunca armazenadas, apenas derivadas</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-secondary/30 rounded-lg">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-crypto-accent" />
              Como Funciona
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-crypto-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-crypto-accent">1</span>
                </div>
                <span>Selecione qualquer arquivo do seu computador</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-crypto-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-crypto-accent">2</span>
                </div>
                <span>Defina uma senha forte (min. 8 caracteres)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-crypto-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-crypto-accent">3</span>
                </div>
                <span>O arquivo é criptografado e baixado como .enc</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-crypto-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-crypto-accent">4</span>
                </div>
                <span>Para descriptografar, use o mesmo processo</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-warning/10 to-crypto-accent/10 rounded-lg border border-warning/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-warning mb-1">Importante</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Nunca perca sua senha!</strong> Sem ela, não é possível recuperar seus arquivos. 
                Recomendamos usar um gerenciador de senhas confiável.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}