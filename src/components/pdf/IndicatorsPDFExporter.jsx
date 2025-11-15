import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { manropeRegularBase64 } from '@/fonts/manrope-base64';
import IndicatorChart from '@/components/projects/IndicatorChart';

/**
 * Componente para exportação elegante de indicadores em PDF
 * Layout horizontal (A4 Landscape) com múltiplos gráficos por página
 * Padrão visual Exxata Control
 */
const IndicatorsPDFExporter = ({ project, indicators = [] }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [renderCharts, setRenderCharts] = useState(false);
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
   * Adiciona página de capa (Estilo Exxata - Fundo Vermelho)
   */
  const addCoverPage = (pdf, logo, pageWidth, pageHeight) => {
    // Fundo vermelho completo
    pdf.setFillColor(...COLORS.exxataRed);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Logo branca centralizada no topo
    if (logo) {
      try {
        const logoH = 20;
        const logoW = logoH * 3.56; // Proporção original
        const logoX = (pageWidth - logoW) / 2; // Centralizado
        pdf.addImage(logo, 'PNG', logoX, 30, logoW, logoH);
      } catch (error) {
        console.error('Erro ao adicionar logo na capa:', error);
      }
    }

    // Título "Relatório de Indicadores" centralizado
    pdf.setFontSize(22);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(255, 255, 255); // Branco
    const title = 'Relatório de Indicadores';
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 60);

    // Card branco centralizado
    const cardWidth = 140;
    const cardHeight = 70;
    const cardX = (pageWidth - cardWidth) / 2;
    const cardY = 75;

    // Sombra do card
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({ opacity: 0.15 }));
    pdf.roundedRect(cardX + 2, cardY + 2, cardWidth, cardHeight, 4, 4, 'F');
    pdf.setGState(new pdf.GState({ opacity: 1 }));

    // Card branco
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'F');

    // Título do card
    pdf.setFontSize(11);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    const cardTitle = 'Título do Projeto';
    pdf.text(cardTitle, cardX + 8, cardY + 10);

    // Nome do projeto
    pdf.setFontSize(13);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    const projectName = project?.name || 'Nome do Projeto';
    const projectLines = pdf.splitTextToSize(projectName, cardWidth - 16);
    pdf.text(projectLines.slice(0, 2), cardX + 8, cardY + 18);

    // Linha divisória
    pdf.setDrawColor(...COLORS.subtleGray);
    pdf.setLineWidth(0.3);
    pdf.line(cardX + 8, cardY + 30, cardX + cardWidth - 8, cardY + 30);

    // Grid de informações (3 colunas)
    const infoStartY = cardY + 38;
    const colWidth = (cardWidth - 16) / 3;

    // Informação 1: Cliente
    pdf.setFontSize(7);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.textGray);
    pdf.text('Cliente Final', cardX + 8, infoStartY);
    
    pdf.setFontSize(8);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    const clientText = project?.client || 'N/A';
    const clientLines = pdf.splitTextToSize(clientText, colWidth - 4);
    pdf.text(clientLines[0], cardX + 8, infoStartY + 5);

    // Informação 2: Data de Exportação
    pdf.setFontSize(7);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.textGray);
    pdf.text('Data de Exportação', cardX + 8 + colWidth, infoStartY);
    
    pdf.setFontSize(8);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    const exportDate = new Date().toLocaleDateString('pt-BR');
    pdf.text(exportDate, cardX + 8 + colWidth, infoStartY + 5);

    // Informação 3: Total de Indicadores
    pdf.setFontSize(7);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.textGray);
    pdf.text('Total de Indicadores', cardX + 8 + (colWidth * 2), infoStartY);
    
    pdf.setFontSize(8);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    pdf.text(String(indicators.length), cardX + 8 + (colWidth * 2), infoStartY + 5);

    // Rodapé do card (texto pequeno)
    pdf.setFontSize(6);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.textGray);
    const footerText = 'Atitude imediata. Resultados notáveis.';
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, cardX + (cardWidth - footerWidth) / 2, cardY + cardHeight - 5);
  };

  /**
   * Adiciona página de Inteligência Humana (Apple Style)
   */
  const addIntelligencePage = (pdf, logo, pageWidth, pageHeight) => {
    const margin = 30;

    // Título principal (minimalista)
    pdf.setFontSize(36);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    const title = 'Inteligência Humana';
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 35);

    // Subtítulo elegante
    pdf.setFontSize(12);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.textGray);
    const subtitle = 'Análises e percepções do time';
    const subtitleWidth = pdf.getTextWidth(subtitle);
    pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, 44);

    // Linha decorativa minimalista
    pdf.setDrawColor(...COLORS.exxataRed);
    pdf.setLineWidth(0.5);
    const lineWidth = 40;
    pdf.line((pageWidth - lineWidth) / 2, 48, (pageWidth + lineWidth) / 2, 48);

    // Conteúdo (se houver)
    const aiText = project?.aiPredictiveText || 'Nenhuma análise disponível no momento.';
    
    // Card de conteúdo estilo Apple
    const cardY = 58;
    const cardWidth = pageWidth - (2 * margin);
    const cardHeight = pageHeight - cardY - 30; // Aumentar margem inferior para rodapé
    
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

    // Adicionar rodapé
    addFooter(pdf, logo, pageWidth, pageHeight);
  };

  /**
   * Adiciona página de Panorama Atual (Layout Horizontal com Cards)
   */
  const addPanoramaPage = (pdf, logo, pageWidth, pageHeight) => {
    const margin = 25;

    // Título principal
    pdf.setFontSize(36);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    const title = 'Panorama Atual';
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 28);

    // Subtítulo
    pdf.setFontSize(11);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.textGray);
    const subtitle = 'Visão geral do projeto';
    const subtitleWidth = pdf.getTextWidth(subtitle);
    pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, 36);

    // Linha decorativa
    pdf.setDrawColor(...COLORS.textGray);
    pdf.setLineWidth(0.3);
    const lineWidth = 30;
    pdf.line((pageWidth - lineWidth) / 2, 39, (pageWidth + lineWidth) / 2, 39);

    // Seções do panorama
    const panorama = project?.panorama || {};
    const sections = [
      { 
        key: 'tecnica', 
        title: 'Aspectos de Ordem Técnica',
        color: [220, 38, 38] // Vermelho
      },
      { 
        key: 'fisica', 
        title: 'Aspectos de Ordem Física',
        color: [59, 130, 246] // Azul
      },
      { 
        key: 'economica', 
        title: 'Aspectos de Ordem Econômica',
        color: [234, 179, 8] // Amarelo/Dourado
      }
    ];

    // Layout horizontal: 3 cards lado a lado
    const cardSpacing = 8;
    const totalCardWidth = pageWidth - (2 * margin);
    const cardWidth = (totalCardWidth - (2 * cardSpacing)) / 3;
    const cardHeight = 85; // Reduzir altura dos cards
    const startY = 48; // Começar mais cedo

    sections.forEach((section, index) => {
      const sectionData = panorama[section.key];
      const items = sectionData?.items || [];
      const status = sectionData?.status || 'yellow';

      // Posição X do card
      const cardX = margin + (index * (cardWidth + cardSpacing));

      // Sombra sutil
      pdf.setFillColor(0, 0, 0);
      pdf.setGState(new pdf.GState({ opacity: 0.05 }));
      pdf.roundedRect(cardX + 1, startY + 1, cardWidth, cardHeight, 4, 4, 'F');
      pdf.setGState(new pdf.GState({ opacity: 1 }));

      // Card principal (fundo branco)
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...COLORS.subtleGray);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(cardX, startY, cardWidth, cardHeight, 4, 4, 'FD');

      // Círculo colorido no topo (ícone do farol)
      const circleRadius = 6;
      const circleX = cardX + (cardWidth / 2);
      const circleY = startY + 12;
      
      // Cor do status (farol) - cores padrão da plataforma
      const statusColors = {
        green: [34, 197, 94],    // Verde
        yellow: [234, 179, 8],   // Amarelo
        red: [239, 68, 68]       // Vermelho (red-500)
      };
      const statusColor = statusColors[status] || statusColors.yellow;
      
      pdf.setFillColor(...statusColor);
      pdf.circle(circleX, circleY, circleRadius, 'F');

      // Título da seção (centralizado)
      pdf.setFontSize(10);
      pdf.setFont('Manrope', 'bold');
      pdf.setTextColor(...COLORS.exxataNavy); // Usar cor padrão navy para todos os títulos
      
      const titleLines = pdf.splitTextToSize(section.title, cardWidth - 8);
      const titleHeight = titleLines.length * 4;
      let titleY = startY + 25;
      
      titleLines.forEach(line => {
        const lineWidth = pdf.getTextWidth(line);
        pdf.text(line, cardX + (cardWidth - lineWidth) / 2, titleY);
        titleY += 4;
      });

      // Contador de itens
      pdf.setFontSize(8);
      pdf.setFont('Manrope', 'normal');
      pdf.setTextColor(...COLORS.textGray);
      const itemsText = items.length > 0 
        ? `${items.length} ${items.length === 1 ? 'item' : 'itens'}`
        : 'Nenhum item';
      const itemsTextWidth = pdf.getTextWidth(itemsText);
      pdf.text(itemsText, cardX + (cardWidth - itemsTextWidth) / 2, titleY + 3);

      // Listar itens (máximo 2)
      const maxItemsToShow = 2;
      const displayItems = items.slice(0, maxItemsToShow);
      
      if (displayItems.length > 0) {
        let itemY = titleY + 10;
        
        displayItems.forEach(item => {
          pdf.setFontSize(7);
          pdf.setTextColor(...COLORS.darkGray);
          const itemText = `— ${item.text || item}`;
          
          // Quebrar texto em múltiplas linhas se necessário
          const maxItemWidth = cardWidth - 8;
          const itemLines = pdf.splitTextToSize(itemText, maxItemWidth);
          
          // Limitar a 2 linhas por item
          const displayItemLines = itemLines.slice(0, 2);
          
          displayItemLines.forEach((line, lineIndex) => {
            if (itemY < startY + cardHeight - 5) { // Verificar se cabe no card
              pdf.text(line, cardX + 4, itemY);
              itemY += 3.5;
            }
          });
          
          itemY += 1; // Espaço entre itens
        });
      }
    });

    // Adicionar rodapé
    addFooter(pdf, logo, pageWidth, pageHeight);
  };

  /**
   * Adiciona página de Informações do Projeto
   */
  const addProjectInfoPage = (pdf, logo, pageWidth, pageHeight) => {
    const margin = 20;

    // Título principal
    pdf.setFontSize(24);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    const title = 'Informações do Projeto';
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 16);

    // Linha decorativa
    pdf.setDrawColor(...COLORS.textGray);
    pdf.setLineWidth(0.3);
    const lineWidth = 30;
    pdf.line((pageWidth - lineWidth) / 2, 19, (pageWidth + lineWidth) / 2, 19);

    // Grid de informações (2 colunas x 4 linhas)
    const cardWidth = (pageWidth - (2 * margin) - 8) / 2;
    const cardHeight = 9;
    const startY = 24;
    const rowSpacing = 1.5;

    // Função auxiliar para formatar datas
    const formatDate = (dateStr) => {
      if (!dateStr || dateStr === 'N/A') return 'N/A';
      const date = new Date(dateStr + 'T00:00:00');
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Função auxiliar para formatar valores monetários
    const formatCurrency = (value) => {
      if (!value || value === 'N/A') return 'N/A';
      
      // Se já está formatado como string (ex: "R$ 1.000.000,00"), retornar
      if (typeof value === 'string' && value.includes('R$')) return value;
      
      // Remover caracteres não numéricos e converter para número
      const numericValue = typeof value === 'string' 
        ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'))
        : parseFloat(value);
      
      if (isNaN(numericValue)) return value;
      
      return `R$ ${numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Dados do projeto com ícones
    const projectInfo = [
      { label: 'Título do Contrato', value: project?.contractSummary || 'N/A', col: 0, row: 0, icon: '📄' },
      { label: 'Localização', value: project?.location || 'N/A', col: 1, row: 0, icon: '📍' },
      { label: 'Período de Vigência', value: (project?.startDate && project?.endDate) ? `${formatDate(project.startDate)} — ${formatDate(project.endDate)}` : 'N/A', col: 0, row: 1, icon: '📅' },
      { label: 'Período de Execução', value: (project?.executionStartDate && project?.executionEndDate) ? `${formatDate(project.executionStartDate)} — ${formatDate(project.executionEndDate)}` : 'N/A', col: 1, row: 1, icon: '⚙️' },
      { label: 'Valor do Contrato', value: formatCurrency(project?.contractValue), col: 0, row: 2, icon: '💰' },
      { label: 'Valor Medido (R0S)', value: formatCurrency(project?.measuredValue), col: 1, row: 2, icon: '📊' },
      { label: 'Data de Assinatura do Contrato', value: formatDate(project?.contractSignatureDate) || 'N/A', col: 0, row: 3, icon: '✍️' },
      { label: 'Data de Assinatura da OS', value: formatDate(project?.osSignatureDate) || 'N/A', col: 1, row: 3, icon: '📝' }
    ];

    // Renderizar cards de informação
    projectInfo.forEach(info => {
      const cardX = margin + (info.col * (cardWidth + 10));
      const cardY = startY + (info.row * (cardHeight + rowSpacing));

      // Card com borda sutil
      pdf.setFillColor(250, 250, 252);
      pdf.setDrawColor(...COLORS.subtleGray);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'FD');

      // Ícone (emoji)
      pdf.setFontSize(8);
      pdf.text(info.icon, cardX + 2, cardY + 3.5);

      // Label (pequeno, cinza)
      pdf.setFontSize(5.5);
      pdf.setFont('Manrope', 'normal');
      pdf.setTextColor(...COLORS.textGray);
      pdf.text(info.label, cardX + 7, cardY + 3.5);

      // Valor (maior, escuro)
      pdf.setFontSize(7.5);
      pdf.setFont('Manrope', 'bold');
      pdf.setTextColor(...COLORS.exxataNavy);
      const valueString = String(info.value); // Converter para string
      const valueText = valueString.length > 50 ? valueString.substring(0, 47) + '...' : valueString;
      pdf.text(valueText, cardX + 2, cardY + 7);
    });

    // Seção de Descrição do Projeto
    const descY = startY + (4 * (cardHeight + rowSpacing)) + 3;
    
    pdf.setFontSize(9);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    pdf.text('Descrição do Projeto', margin, descY);

    const descCardY = descY + 3.5;
    const descCardHeight = 10;
    
    pdf.setFillColor(250, 250, 252);
    pdf.setDrawColor(...COLORS.subtleGray);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(margin, descCardY, pageWidth - (2 * margin), descCardHeight, 2, 2, 'FD');

    pdf.setFontSize(6.5);
    pdf.setFont('Manrope', 'normal');
    pdf.setTextColor(...COLORS.darkGray);
    const description = project?.description || 'Sem descrição disponível';
    const descLines = pdf.splitTextToSize(description, pageWidth - (2 * margin) - 6);
    pdf.text(descLines.slice(0, 2), margin + 3, descCardY + 3.5);

    // Seção de Progressos (barras)
    const progressY = descCardY + descCardHeight + 4;
    
    pdf.setFontSize(9);
    pdf.setFont('Manrope', 'bold');
    pdf.setTextColor(...COLORS.exxataNavy);
    pdf.text('Progressos', margin, progressY);

    // Dados de progresso
    const progressData = [
      { 
        label: 'Progresso de Prazo', 
        value: project?.progress || 0,
        color: [239, 68, 68], // Vermelho
        col: 0
      },
      { 
        label: 'Progresso de Avanço Físico Contratado', 
        value: project?.physicalProgressContract || 0,
        color: [239, 68, 68], // Vermelho
        col: 0
      },
      { 
        label: 'Progresso em Faturamento Contratado', 
        value: project?.billingProgressContract || 0,
        color: [239, 68, 68], // Vermelho
        col: 0
      },
      { 
        label: 'Progresso de Avanço Físico Real', 
        value: project?.physicalProgressReal || 0,
        color: [59, 130, 246], // Azul
        col: 1
      },
      { 
        label: 'Progresso em Faturamento Real', 
        value: project?.billingProgress || 0,
        color: [59, 130, 246], // Azul
        col: 1
      }
    ];

    const progressCardWidth = (pageWidth - (2 * margin) - 8) / 2;
    const progressCardHeight = 14;
    const progressStartY = progressY + 4;
    let leftColY = progressStartY;
    let rightColY = progressStartY;

    progressData.forEach(prog => {
      const cardX = margin + (prog.col * (progressCardWidth + 8));
      const cardY = prog.col === 0 ? leftColY : rightColY;

      // Card
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...COLORS.subtleGray);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(cardX, cardY, progressCardWidth, progressCardHeight, 2, 2, 'FD');

      // Label
      pdf.setFontSize(7);
      pdf.setFont('Manrope', 'bold');
      pdf.setTextColor(...COLORS.exxataNavy);
      const labelLines = pdf.splitTextToSize(prog.label, progressCardWidth - 30);
      pdf.text(labelLines[0], cardX + 2, cardY + 4);

      // Percentual
      pdf.setFontSize(12);
      pdf.setFont('Manrope', 'bold');
      pdf.setTextColor(...prog.color);
      const percentText = `${Math.round(prog.value)}%`;
      const percentWidth = pdf.getTextWidth(percentText);
      pdf.text(percentText, cardX + progressCardWidth - percentWidth - 2, cardY + 4);

      // Barra de progresso
      const barY = cardY + 7;
      const barWidth = progressCardWidth - 4;
      const barHeight = 3;

      // Fundo da barra (cinza claro)
      pdf.setFillColor(226, 232, 240);
      pdf.roundedRect(cardX + 2, barY, barWidth, barHeight, 1.5, 1.5, 'F');

      // Barra de progresso (colorida)
      const progressWidth = (barWidth * prog.value) / 100;
      if (progressWidth > 0) {
        pdf.setFillColor(...prog.color);
        pdf.roundedRect(cardX + 2, barY, progressWidth, barHeight, 1.5, 1.5, 'F');
      }

      // Labels 0% e 100%
      pdf.setFontSize(5);
      pdf.setFont('Manrope', 'normal');
      pdf.setTextColor(...COLORS.textGray);
      pdf.text('0%', cardX + 2, barY + barHeight + 2.5);
      pdf.text('100%', cardX + progressCardWidth - 8, barY + barHeight + 2.5);

      // Atualizar posição Y
      if (prog.col === 0) {
        leftColY += progressCardHeight + 2;
      } else {
        rightColY += progressCardHeight + 2;
      }
    });

    // Adicionar rodapé
    addFooter(pdf, logo, pageWidth, pageHeight);
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
    
    // Renderizar gráficos temporariamente se não estiverem visíveis
    setRenderCharts(true);
    
    // Aguardar renderização inicial dos gráficos
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Disparar múltiplos eventos resize para forçar re-render de gráficos SVG
    for (let i = 0; i < 5; i++) {
      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Aguardar estabilização final
    await new Promise(resolve => setTimeout(resolve, 1000));

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
      addIntelligencePage(pdf, logoDataUrl, pageWidth, pageHeight);

      // Página de Informações do Projeto
      pdf.addPage();
      addProjectInfoPage(pdf, logoDataUrl, pageWidth, pageHeight);

      // Página de Panorama Atual
      pdf.addPage();
      addPanoramaPage(pdf, logoDataUrl, pageWidth, pageHeight);

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
      const totalPages = Math.ceil(indicators.length / chartsPerPage) + 4; // +4 (capa + inteligência + info projeto + panorama)

      let currentPage = 4; // Já temos capa + inteligência + info projeto + panorama
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
        
        // Dimensões de cada slot (2x2 grid)
        const slotWidth = (contentWidth - 10) / 2; // 10mm de espaçamento entre colunas
        const slotHeight = (availableHeight - 10) / 2; // 10mm de espaçamento entre linhas

        // Renderizar até 4 gráficos nesta página
        for (let i = 0; i < chartsPerPage && chartIndex < indicators.length; i++) {
          const card = chartCards[chartIndex];
          const indicator = indicators[chartIndex];

          // Capturar apenas o CardContent (sem header, sem borda do card)
          const cardContent = card.querySelector('.indicator-card-content') || card;
          
          // Ocultar botões de ação antes da captura
          const actionButtons = card.querySelectorAll('.indicator-action-buttons');
          actionButtons.forEach(btn => btn.style.display = 'none');

          // Verificar se o gráfico é de 1 coluna (não expandido)
          const isSmallChart = indicator.size !== 'large';
          
          // Se for gráfico de 1 coluna, forçar largura expandida temporariamente
          let originalStyles = {};
          let containerDiv = null;
          
          if (isSmallChart) {
            // Encontrar o container div (parent do card)
            containerDiv = card.parentElement;
            
            // Salvar estilos originais
            originalStyles.cardWidth = card.style.width;
            originalStyles.cardMinWidth = card.style.minWidth;
            originalStyles.cardMaxWidth = card.style.maxWidth;
            originalStyles.cardDisplay = card.style.display;
            
            if (containerDiv) {
              originalStyles.containerWidth = containerDiv.style.width;
              originalStyles.containerMinWidth = containerDiv.style.minWidth;
              originalStyles.containerMaxWidth = containerDiv.style.maxWidth;
              originalStyles.containerGridColumn = containerDiv.style.gridColumn;
              originalStyles.containerClass = containerDiv.className;
              
              // Forçar largura expandida no container (simular lg:col-span-2)
              containerDiv.style.gridColumn = 'span 2 / span 2';
              containerDiv.style.width = '100%';
              containerDiv.style.minWidth = '100%';
              containerDiv.style.maxWidth = '100%';
            }
            
            // Forçar largura expandida no card
            card.style.width = '100%';
            card.style.minWidth = '100%';
            card.style.maxWidth = '100%';
            card.style.display = 'block';
            
            // Aguardar o DOM aplicar os estilos
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            
            // Forçar re-render do gráfico (disparar evento resize múltiplas vezes)
            window.dispatchEvent(new Event('resize'));
            await new Promise(resolve => setTimeout(resolve, 100));
            window.dispatchEvent(new Event('resize'));
            await new Promise(resolve => setTimeout(resolve, 100));
            window.dispatchEvent(new Event('resize'));
            
            // Aguardar frames adicionais para garantir renderização completa
            await new Promise(resolve => requestAnimationFrame(() => 
              requestAnimationFrame(() => 
                requestAnimationFrame(() => 
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() =>
                      requestAnimationFrame(resolve)
                    )
                  )
                )
              )
            ));
            
            // Delay final para estabilização (maior para gráficos SVG como rosca/pizza)
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Calcular posição no grid (2x2)
          const row = Math.floor(i / chartsPerRow);
          const col = i % chartsPerRow;
          
          const x = margin + (col * (slotWidth + 10));
          const y = contentY + (row * (slotHeight + 10));

          // Capturar apenas o conteúdo do gráfico (sem bordas do card)
          const canvas = await html2canvas(cardContent, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: cardContent.scrollWidth,
            windowHeight: cardContent.scrollHeight
          });

          // Restaurar estilos originais se foi modificado
          if (isSmallChart) {
            card.style.width = originalStyles.cardWidth;
            card.style.minWidth = originalStyles.cardMinWidth;
            card.style.maxWidth = originalStyles.cardMaxWidth;
            card.style.display = originalStyles.cardDisplay;
            
            if (containerDiv) {
              containerDiv.style.width = originalStyles.containerWidth;
              containerDiv.style.minWidth = originalStyles.containerMinWidth;
              containerDiv.style.maxWidth = originalStyles.containerMaxWidth;
              containerDiv.style.gridColumn = originalStyles.containerGridColumn;
            }
          }

          const imgData = canvas.toDataURL('image/png');
          
          // Determinar se há observações
          const hasObservations = indicator.observations && indicator.observations.trim();
          
          // Calcular dimensões baseado na presença de observações
          let graphWidth, observationsWidth;
          if (hasObservations) {
            // Layout: 60% gráfico + 40% análise
            graphWidth = slotWidth * 0.58;
            observationsWidth = slotWidth * 0.40;
          } else {
            // Sem observações: gráfico ocupa tudo
            graphWidth = slotWidth;
            observationsWidth = 0;
          }
          
          // Título do indicador (acima do slot)
          pdf.setFontSize(9);
          pdf.setFont('Manrope', 'bold');
          pdf.setTextColor(...COLORS.exxataNavy);
          
          let title = indicator.title || `Indicador ${chartIndex + 1}`;
          if (pdf.getTextWidth(title) > slotWidth - 4) {
            while (pdf.getTextWidth(title + '...') > slotWidth - 4 && title.length > 10) {
              title = title.substring(0, title.length - 1);
            }
            title += '...';
          }
          
          pdf.text(title, x + 2, y - 2);
          
          // Calcular dimensões do gráfico mantendo proporção
          const imgAspectRatio = canvas.width / canvas.height;
          const availableGraphHeight = slotHeight - 8; // Espaço para título
          
          let finalWidth = graphWidth - 4;
          let finalHeight = finalWidth / imgAspectRatio;
          
          // Ajustar se altura exceder limite
          if (finalHeight > availableGraphHeight) {
            finalHeight = availableGraphHeight;
            finalWidth = finalHeight * imgAspectRatio;
          }

          // Centralizar gráfico no espaço disponível
          const graphX = x + (graphWidth - finalWidth) / 2;
          const graphY = y + 5 + (availableGraphHeight - finalHeight) / 2;

          // Adicionar imagem do gráfico
          pdf.addImage(imgData, 'PNG', graphX, graphY, finalWidth, finalHeight);

          // Adicionar box de análise ao lado direito (se existir)
          if (hasObservations) {
            const analysisX = x + graphWidth + 2;
            const analysisY = y + 3;
            const analysisHeight = slotHeight - 5;
            
            // Box de fundo padrão da plataforma (cinza claro)
            pdf.setFillColor(248, 250, 252); // Cinza claro #F8FAFC
            pdf.setDrawColor(226, 232, 240); // Borda sutil #E2E8F0
            pdf.setLineWidth(0.2);
            pdf.roundedRect(analysisX, analysisY, observationsWidth - 2, analysisHeight, 2, 2, 'FD');
            
            // Título "Análise Exxata"
            pdf.setFontSize(7);
            pdf.setFont('Manrope', 'bold');
            pdf.setTextColor(...COLORS.exxataRed);
            pdf.text('Análise Exxata', analysisX + 3, analysisY + 5);
            
            // Linha separadora sutil
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.1);
            pdf.line(analysisX + 3, analysisY + 7, analysisX + observationsWidth - 5, analysisY + 7);
            
            // Texto das observações
            pdf.setFontSize(6.5);
            pdf.setFont('Manrope', 'normal');
            pdf.setTextColor(...COLORS.darkGray);
            
            // Quebrar texto em múltiplas linhas
            const textMaxWidth = observationsWidth - 6;
            const lines = pdf.splitTextToSize(indicator.observations.trim(), textMaxWidth);
            const lineHeight = 2.8;
            const maxLines = Math.floor((analysisHeight - 12) / lineHeight);
            const displayLines = lines.slice(0, maxLines);
            
            // Se texto foi truncado, adicionar "..."
            if (lines.length > maxLines && displayLines.length > 0) {
              const lastLine = displayLines[displayLines.length - 1];
              displayLines[displayLines.length - 1] = lastLine.substring(0, Math.max(0, lastLine.length - 3)) + '...';
            }
            
            // Renderizar linhas
            let textY = analysisY + 10;
            displayLines.forEach((line, idx) => {
              pdf.text(line, analysisX + 3, textY, { 
                maxWidth: textMaxWidth,
                align: 'left'
              });
              textY += lineHeight;
            });
          }

          // Restaurar botões após captura
          actionButtons.forEach(btn => btn.style.display = '');

          chartIndex++;
          
          // Pequeno delay entre capturas para garantir estabilidade
          await new Promise(resolve => setTimeout(resolve, 100));
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
      setRenderCharts(false); // Remover gráficos temporários
    }
  };

  return (
    <>
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

      {/* Renderizar gráficos temporariamente de forma oculta */}
      {renderCharts && (
        <div 
          ref={chartsRef}
          style={{ 
            position: 'fixed', 
            left: '-9999px', 
            top: 0,
            width: '1200px',
            zIndex: -1
          }}
        >
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {indicators.map(indicator => (
              <div
                key={indicator.id}
                className={`${indicator.size === 'large' ? 'lg:col-span-2' : 'lg:col-span-1'}`}
              >
                <Card className="chart-card h-full" data-indicator-id={indicator.id}>
                  <CardHeader className="card-header-pdf">
                    <CardTitle>{indicator.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="indicator-card-content">
                    <IndicatorChart indicator={indicator} />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default IndicatorsPDFExporter;
