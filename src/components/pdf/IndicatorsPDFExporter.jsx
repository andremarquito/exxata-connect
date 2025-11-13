import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { manropeRegularBase64 } from '@/fonts/manrope-base64';

/**
 * Componente para exportação elegante de indicadores em PDF
 * Layout horizontal (A4 Landscape) com múltiplos gráficos por página
 * Padrão visual Exxata Control
 */
const IndicatorsPDFExporter = ({ project, indicators = [] }) => {
  const [isExporting, setIsExporting] = useState(false);
  const chartsRef = useRef(null);

  // Cores da marca Exxata
  const COLORS = {
    exxataRed: [213, 29, 7],      // #D51D07
    exxataNavy: [9, 24, 43],      // #09182B
    lightGray: [248, 250, 252],   // #F8FAFC
    darkGray: [71, 85, 105],      // #475569
    textGray: [100, 116, 139],    // #64748B
    subtleGray: [226, 232, 240],  // #E2E8F0
    white: [255, 255, 255]
  };

  /**
   * Carrega imagem como DataURL (base64)
   */
  const loadImageAsDataURL = async (src) => {
    try {
      const res = await fetch(src, { cache: 'no-store' });
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      return null;
    }
  };

  /**
   * Adiciona cabeçalho elegante em cada página
   */
  const addHeader = (pdf, pageNum, totalPages, logo, pageWidth) => {
    const margin = 15;

    // Faixa superior com gradiente simulado
    pdf.setFillColor(...COLORS.lightGray);
    pdf.rect(0, 0, pageWidth, 20, 'F');

    // Linha inferior sutil
    pdf.setDrawColor(...COLORS.subtleGray);
    pdf.setLineWidth(0.5);
    pdf.line(0, 20, pageWidth, 20);

    // Logo Exxata (proporção original 1920x540 = 3.56:1)
    if (logo) {
      try {
        const logoH = 12;
        const logoW = logoH * 3.56; // Manter proporção original
        pdf.addImage(logo, 'PNG', margin, 4, logoW, logoH);
      } catch (error) {
        console.error('Erro ao adicionar logo:', error);
      }
    }

    // Título do relatório (centro)
    pdf.setFontSize(14);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    const title = 'Relatório de Indicadores';
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 13);

    // Número da página (direita)
    pdf.setFontSize(9);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.textGray);
    const pageText = `Página ${pageNum} de ${totalPages}`;
    const pageTextWidth = pdf.getTextWidth(pageText);
    pdf.text(pageText, pageWidth - margin - pageTextWidth, 13);
  };

  /**
   * Adiciona rodapé elegante com informações da empresa
   */
  const addFooter = (pdf, logo, pageWidth, pageHeight) => {
    const margin = 15;
    const footerY = pageHeight - 20;

    // Linha superior
    pdf.setDrawColor(...COLORS.subtleGray);
    pdf.setLineWidth(0.5);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    // Faixa inferior
    pdf.setFillColor(...COLORS.lightGray);
    pdf.rect(0, footerY + 2, pageWidth, 18, 'F');

    // Endereços (esquerda)
    pdf.setFontSize(7);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.darkGray);
    
    const bhText = 'BH: Av. Getúlio Vargas, 671 - 10º Andar';
    const spText = 'SP: Av. Eng. Luiz Carlos Berrini, 105 - Sala 111';
    
    pdf.text(bhText, margin, footerY + 8);
    pdf.text(spText, margin, footerY + 13);

    // Logo central (proporção original 1920x540 = 3.56:1)
    if (logo) {
      try {
        const logoH = 8;
        const logoW = logoH * 3.56; // Manter proporção original
        const logoX = (pageWidth - logoW) / 2;
        pdf.addImage(logo, 'PNG', logoX, footerY + 6, logoW, logoH);
      } catch (error) {
        console.error('Erro ao adicionar logo no rodapé:', error);
      }
    }

    // Slogan (direita)
    pdf.setFontSize(8);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.textGray);
    const slogan = 'Atitude imediata. Resultados notáveis.';
    const sloganWidth = pdf.getTextWidth(slogan);
    pdf.text(slogan, pageWidth - margin - sloganWidth, footerY + 11);
  };

  /**
   * Adiciona página de capa elegante
   */
  const addCoverPage = (pdf, logo, pageWidth, pageHeight) => {
    const margin = 15;

    // Faixa superior azul marinho (maior)
    pdf.setFillColor(...COLORS.exxataNavy);
    pdf.rect(0, 0, pageWidth, 80, 'F');

    // Logo grande centralizada (proporção original 1920x540 = 3.56:1)
    if (logo) {
      try {
        const logoH = 35;
        const logoW = logoH * 3.56; // Manter proporção original
        const logoX = (pageWidth - logoW) / 2;
        pdf.addImage(logo, 'PNG', logoX, 22.5, logoW, logoH);
      } catch (error) {
        console.error('Erro ao adicionar logo na capa:', error);
      }
    }

    // Área branca
    const contentStartY = 95;

    // Título principal
    pdf.setFontSize(36);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    const title = 'Relatório de Indicadores';
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, contentStartY);

    // Nome do projeto (subtítulo)
    if (project?.name) {
      pdf.setFontSize(20);
      pdf.setFont('Manrope', 'normal');
      pdf.setTextColor(...COLORS.textGray);
      const projectName = project.name;
      const projectWidth = pdf.getTextWidth(projectName);
      pdf.text(projectName, (pageWidth - projectWidth) / 2, contentStartY + 12);
    }

    // Card de informações elegante
    const cardY = contentStartY + 28;
    const cardWidth = 180;
    const cardX = (pageWidth - cardWidth) / 2;
    
    // Sombra sutil
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({ opacity: 0.05 }));
    pdf.roundedRect(cardX + 1, cardY + 1, cardWidth, 32, 3, 3, 'F');
    pdf.setGState(new pdf.GState({ opacity: 1 }));
    
    // Card principal
    pdf.setFillColor(250, 250, 252);
    pdf.setDrawColor(...COLORS.subtleGray);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(cardX, cardY, cardWidth, 32, 3, 3, 'FD');

    // Título do card
    pdf.setFontSize(10);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    pdf.text('Informações do Projeto', cardX + 8, cardY + 8);

    // Informações em grid
    pdf.setFontSize(8);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.darkGray);

    let infoY = cardY + 16;
    
    // Cliente
    const clientText = project?.client ? project.client : 'Cliente não informado';
    pdf.setFont('Manrope', 'bold');
    pdf.text('Cliente:', cardX + 8, infoY);
    pdf.setFont('Manrope', 'normal');
    pdf.text(clientText, cardX + 25, infoY);
    
    // Data de exportação
    infoY += 5;
    const exportDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.setFont('Manrope', 'bold');
    pdf.text('Data de Exportação:', cardX + 8, infoY);
    pdf.setFont('Manrope', 'normal');
    pdf.text(exportDate, cardX + 42, infoY);
    
    // Total de indicadores
    infoY += 5;
    pdf.setFont('Manrope', 'bold');
    pdf.text('Total de Indicadores:', cardX + 8, infoY);
    pdf.setFont('Manrope', 'normal');
    pdf.text(String(indicators.length), cardX + 42, infoY);

    // Rodapé minimalista (apenas slogan)
    const footerY = pageHeight - 10;
    
    // Slogan centralizado
    pdf.setFont('Manrope', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.textGray);
    const slogan = 'Atitude imediata. Resultados notáveis.';
    const sloganWidth = pdf.getTextWidth(slogan);
    pdf.text(slogan, (pageWidth - sloganWidth) / 2, footerY);
  };

  /**
   * Adiciona página de Inteligência Humana (Apple Style)
   */
  const addIntelligencePage = (pdf, pageWidth, pageHeight) => {
    const margin = 30;

    // Título principal (minimalista)
    pdf.setFontSize(42);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    const title = 'Inteligência Humana';
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 50);

    // Subtítulo elegante
    pdf.setFontSize(14);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.textGray);
    const subtitle = 'Análises e percepções do time';
    const subtitleWidth = pdf.getTextWidth(subtitle);
    pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, 62);

    // Linha decorativa minimalista
    pdf.setDrawColor(...COLORS.exxataRed);
    pdf.setLineWidth(0.5);
    const lineWidth = 40;
    pdf.line((pageWidth - lineWidth) / 2, 68, (pageWidth + lineWidth) / 2, 68);

    // Conteúdo (se houver)
    const aiText = project?.aiPredictiveText || 'Nenhuma análise disponível no momento.';
    
    // Card de conteúdo estilo Apple
    const cardY = 80;
    const cardWidth = pageWidth - (2 * margin);
    const cardHeight = pageHeight - cardY - 20;
    
    // Sombra sutil
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({ opacity: 0.03 }));
    pdf.roundedRect(margin + 2, cardY + 2, cardWidth, cardHeight, 4, 4, 'F');
    pdf.setGState(new pdf.GState({ opacity: 1 }));
    
    // Card principal
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...COLORS.subtleGray);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(margin, cardY, cardWidth, cardHeight, 4, 4, 'FD');

    // Texto do conteúdo com quebra de linha adequada
    pdf.setFontSize(10);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.darkGray);
    
    // Quebrar texto respeitando os limites do card
    const maxWidth = cardWidth - 20; // Margem interna
    const textLines = pdf.splitTextToSize(aiText, maxWidth);
    
    // Limitar número de linhas para não ultrapassar o card
    const lineHeight = 5;
    const maxLines = Math.floor((cardHeight - 20) / lineHeight);
    const displayLines = textLines.slice(0, maxLines);
    
    pdf.text(displayLines, margin + 10, cardY + 12);
  };

  /**
   * Adiciona página de Panorama Atual (Apple Style - Layout Vertical)
   */
  const addPanoramaPage = (pdf, pageWidth, pageHeight) => {
    const margin = 30;

    // Título principal
    pdf.setFontSize(42);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    const title = 'Panorama Atual';
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 45);

    // Subtítulo
    pdf.setFontSize(14);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.textGray);
    const subtitle = 'Visão geral do projeto';
    const subtitleWidth = pdf.getTextWidth(subtitle);
    pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, 57);

    // Linha decorativa
    pdf.setDrawColor(...COLORS.exxataRed);
    pdf.setLineWidth(0.5);
    const lineWidth = 40;
    pdf.line((pageWidth - lineWidth) / 2, 63, (pageWidth + lineWidth) / 2, 63);

    // Seções do panorama
    const panorama = project?.panorama || {};
    const sections = [
      { key: 'tecnica', title: 'Aspectos de Ordem Técnica' },
      { key: 'fisica', title: 'Aspectos de Ordem Física' },
      { key: 'economica', title: 'Aspectos de Ordem Econômica' }
    ];

    let currentY = 75;
    const cardWidth = pageWidth - (2 * margin);

    sections.forEach((section, index) => {
      const sectionData = panorama[section.key];
      const items = sectionData?.items || [];
      const status = sectionData?.status || 'yellow';

      // Calcular altura dinâmica do card baseado no número de itens
      const maxItemsToShow = 2;
      const displayItems = items.slice(0, maxItemsToShow);
      const baseHeight = 20;
      const itemHeight = 4;
      const cardHeight = baseHeight + (displayItems.length * itemHeight);

      // Cor do status
      const statusColors = {
        green: [34, 197, 94],
        yellow: [234, 179, 8],
        red: [220, 38, 38]
      };
      const statusColor = statusColors[status] || statusColors.yellow;

      // Sombra sutil
      pdf.setFillColor(0, 0, 0);
      pdf.setGState(new pdf.GState({ opacity: 0.03 }));
      pdf.roundedRect(margin + 1, currentY + 1, cardWidth, cardHeight, 3, 3, 'F');
      pdf.setGState(new pdf.GState({ opacity: 1 }));

      // Card principal
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...COLORS.subtleGray);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, 'FD');

      // Barra lateral de status (mais larga e visível)
      pdf.setFillColor(...statusColor);
      pdf.roundedRect(margin, currentY, 4, cardHeight, 3, 3, 'F');

      // Título da seção
      pdf.setFontSize(11);
      pdf.setFont('Manrope', 'bold');
      pdf.setTextColor(...COLORS.exxataNavy);
      pdf.text(section.title, margin + 12, currentY + 7);

      // Contador de itens
      pdf.setFontSize(8);
      pdf.setFont('Manrope', 'normal');
      pdf.setTextColor(...COLORS.textGray);
      const itemsText = items.length > 0 
        ? `${items.length} ${items.length === 1 ? 'item' : 'itens'}`
        : 'Nenhum item';
      pdf.text(itemsText, margin + 12, currentY + 13);

      // Listar itens
      if (displayItems.length > 0) {
        let itemY = currentY + 18;
        
        displayItems.forEach(item => {
          pdf.setFontSize(8);
          pdf.setTextColor(...COLORS.darkGray);
          const itemText = `• ${item.text || item}`;
          
          // Truncar texto se muito longo
          const maxItemWidth = cardWidth - 20;
          const truncated = pdf.splitTextToSize(itemText, maxItemWidth)[0];
          
          pdf.text(truncated, margin + 14, itemY);
          itemY += itemHeight;
        });
      }

      // Avançar para próximo card
      currentY += cardHeight + 6;
    });
  };

  /**
   * Função principal de exportação
   */
  const handleExport = async () => {
    if (!indicators || indicators.length === 0) {
      alert('Não há indicadores para exportar.');
      return;
    }

    setIsExporting(true);

    try {
      // Criar PDF em formato 16:9 (widescreen/PowerPoint)
      // Dimensões: 297mm x 167.06mm (proporção 16:9)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [167.06, 297] // altura x largura (16:9)
      });
      
      // Adicionar fonte Manrope ao PDF
      pdf.addFileToVFS('Manrope-Regular.ttf', manropeRegularBase64);
      pdf.addFont('Manrope-Regular.ttf', 'Manrope', 'normal');
      pdf.addFont('Manrope-Regular.ttf', 'Manrope', 'bold'); // Usar Regular como bold também
      
      // Definir Manrope como fonte padrão
      pdf.setFont('Manrope', 'normal');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);

      // Carregar logos (escura para header/footer, clara para capa)
      const logoUrl = '/Assinatura-de-Marca---Exxata_01.png';
      const logoDataUrl = await loadImageAsDataURL(logoUrl);
      const logoClaraUrl = '/Assinatura-de-Marca---Exxata_03.png';
      const logoClaraDataUrl = await loadImageAsDataURL(logoClaraUrl);

      // Página de capa (usa logo clara)
      addCoverPage(pdf, logoClaraDataUrl, pageWidth, pageHeight);

      // Página de Inteligência Humana (após capa)
      pdf.addPage();
      addIntelligencePage(pdf, pageWidth, pageHeight);

      // Página de Panorama Atual
      pdf.addPage();
      addPanoramaPage(pdf, pageWidth, pageHeight);

      // Capturar todos os cards de gráficos
      const chartCards = document.querySelectorAll('.chart-card');
      
      if (!chartCards || chartCards.length === 0) {
        alert('Erro ao capturar os gráficos. Certifique-se de que os indicadores estão visíveis.');
        setIsExporting(false);
        return;
      }

      // Configuração do grid: 2 gráficos por linha
      const chartsPerRow = 2;
      const chartsPerPage = 4; // 2 linhas x 2 colunas
      const totalPages = Math.ceil(indicators.length / chartsPerPage) + 3; // +3 (capa + inteligência + panorama)

      let currentPage = 3; // Já temos capa + inteligência + panorama
      let chartIndex = 0;

      // Processar gráficos em lotes
      while (chartIndex < indicators.length) {
        pdf.addPage();
        currentPage++;

        // Adicionar cabeçalho e rodapé
        addHeader(pdf, currentPage, totalPages, logoDataUrl, pageWidth);
        addFooter(pdf, logoDataUrl, pageWidth, pageHeight);

        // Área de conteúdo
        const contentY = 30;
        const availableHeight = pageHeight - contentY - 25;
        
        // Dimensões de cada gráfico
        const chartWidth = (contentWidth - 10) / 2; // 10mm de espaçamento entre colunas
        const chartHeight = (availableHeight - 10) / 2; // 10mm de espaçamento entre linhas

        // Renderizar até 4 gráficos nesta página
        for (let i = 0; i < chartsPerPage && chartIndex < indicators.length; i++) {
          const card = chartCards[chartIndex];
          const indicator = indicators[chartIndex];

          // Capturar apenas o CardContent (sem header, sem borda do card)
          const cardContent = card.querySelector('.indicator-card-content') || card;
          
          // Ocultar botões de ação antes da captura
          const actionButtons = card.querySelectorAll('.indicator-action-buttons');
          actionButtons.forEach(btn => btn.style.display = 'none');

          // Calcular posição no grid (2x2)
          const row = Math.floor(i / chartsPerRow);
          const col = i % chartsPerRow;
          
          const x = margin + (col * (chartWidth + 10));
          const y = contentY + (row * (chartHeight + 10));

          // Capturar apenas o conteúdo do gráfico (sem bordas do card)
          const canvas = await html2canvas(cardContent, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: cardContent.scrollWidth,
            windowHeight: cardContent.scrollHeight
          });

          const imgData = canvas.toDataURL('image/png');
          
          // Calcular dimensões mantendo proporção
          const imgAspectRatio = canvas.width / canvas.height;
          let finalWidth = chartWidth - 4; // Margem interna
          let finalHeight = (chartWidth - 4) / imgAspectRatio;
          
          // Ajustar se altura exceder limite
          if (finalHeight > chartHeight - 12) { // Espaço para título
            finalHeight = chartHeight - 12;
            finalWidth = (chartHeight - 12) * imgAspectRatio;
          }

          // Centralizar imagem no espaço disponível (deixar espaço para título)
          const imgX = x + (chartWidth - finalWidth) / 2;
          const imgY = y + 10 + (chartHeight - 12 - finalHeight) / 2;

          // Adicionar imagem (sem borda extra)
          pdf.addImage(imgData, 'PNG', imgX, imgY, finalWidth, finalHeight);

          // Título do indicador (acima do box)
          pdf.setFontSize(9);
          pdf.setFont('Manrope', 'bold');
          pdf.setTextColor(...COLORS.exxataNavy);
          
          // Truncar título se muito longo
          let title = indicator.title || `Indicador ${chartIndex + 1}`;
          if (pdf.getTextWidth(title) > chartWidth) {
            while (pdf.getTextWidth(title + '...') > chartWidth && title.length > 10) {
              title = title.substring(0, title.length - 1);
            }
            title += '...';
          }
          
          pdf.text(title, x + 2, y - 2);

          // Restaurar botões após captura
          actionButtons.forEach(btn => btn.style.display = '');

          chartIndex++;
        }
      }

      // Salvar PDF
      const fileName = `${project?.name || 'Projeto'}_Indicadores_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

      console.log('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={isExporting || indicators.length === 0}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </>
      )}
    </Button>
  );
};

export default IndicatorsPDFExporter;
