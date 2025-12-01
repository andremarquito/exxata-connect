import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, Trash2, ZoomIn, ZoomOut, Maximize2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TimelineTab({ project, canEdit, onUpdate }) {
  const [timelineImage, setTimelineImage] = useState(project?.timelineImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione apenas arquivos PNG ou JPEG.');
      return;
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('O arquivo deve ter no máximo 10MB.');
      return;
    }

    setIsUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${project.id}_timeline_${Date.now()}.${fileExt}`;
      const filePath = `timelines/${fileName}`;

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Atualizar projeto no banco
      await onUpdate({ timelineImage: publicUrl });
      setTimelineImage(publicUrl);

      alert('Linha do tempo atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da linha do tempo:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover a linha do tempo?')) return;

    try {
      // Extrair o caminho do arquivo da URL
      if (timelineImage) {
        const urlParts = timelineImage.split('/');
        const filePath = `timelines/${urlParts[urlParts.length - 1]}`;

        // Deletar do storage
        await supabase.storage
          .from('project-files')
          .remove([filePath]);
      }

      // Atualizar projeto no banco
      await onUpdate({ timelineImage: null });
      setTimelineImage(null);
      setZoom(1);

      alert('Linha do tempo removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover linha do tempo:', error);
      alert('Erro ao remover a imagem. Tente novamente.');
    }
  };

  const handleDownload = () => {
    if (!timelineImage) return;
    
    const link = document.createElement('a');
    link.href = timelineImage;
    link.download = `${project.name}_linha_do_tempo.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-exxata-red/10 rounded-lg">
                <Calendar className="h-6 w-6 text-exxata-red" />
              </div>
              <div>
                <CardTitle>Linha do Tempo do Projeto</CardTitle>
                <CardDescription>
                  Visualize os marcos e eventos importantes do projeto em ordem cronológica
                </CardDescription>
              </div>
            </div>
            
            {canEdit && (
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {timelineImage ? 'Substituir' : 'Upload'}
                </Button>
                {timelineImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isUploading}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Área de visualização */}
      {timelineImage ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Visualização</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="gap-2"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetZoom}
                  className="gap-2"
                >
                  <Maximize2 className="h-4 w-4" />
                  {Math.round(zoom * 100)}%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="gap-2"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto border rounded-lg bg-gray-50 p-4">
              <div className="flex justify-center">
                <img
                  src={timelineImage}
                  alt="Linha do Tempo do Projeto"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease-in-out',
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                  className="shadow-lg rounded-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Nenhuma linha do tempo configurada
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  {canEdit
                    ? 'Faça upload de uma imagem PNG ou JPEG para visualizar a linha do tempo do projeto.'
                    : 'A linha do tempo ainda não foi configurada para este projeto.'}
                </p>
              </div>
              {canEdit && (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-exxata-red hover:bg-red-700 gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Enviando...' : 'Fazer Upload da Linha do Tempo'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dicas de uso */}
      {canEdit && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                💡 Dicas para criar sua linha do tempo
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 ml-4">
                <li>• Use ferramentas como PowerPoint, Canva ou Figma para criar o design</li>
                <li>• Formato recomendado: PNG ou JPEG</li>
                <li>• Tamanho máximo: 10MB</li>
                <li>• Resolução sugerida: 1920x1080 pixels ou superior</li>
                <li>• Organize eventos por categorias e datas para melhor visualização</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
