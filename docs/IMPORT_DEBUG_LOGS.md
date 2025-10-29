# Logs Detalhados de Importação de Indicadores

## Problema Resolvido

A importação de indicadores não estava mostrando logs no console, dificultando o debug quando ocorriam problemas.

## Solução Implementada

Adicionados **logs detalhados em todas as etapas** do processo de importação:

### 1. **Início da Importação**
```
🚀 Iniciando importação de indicadores...
📁 Arquivo selecionado: g1_prazo_decorrido.xlsx
📖 Lendo arquivo...
✅ ArrayBuffer criado, tamanho: 12345
✅ Workbook criado
📋 Abas encontradas no arquivo: ['Configurações', 'Dados', 'Cores']
```

### 2. **Validação das Abas**
```
✅ Tem aba Configurações? true
✅ Tem aba Dados? true
✅ Tem aba Cores? true
✨ Formato de 3 abas detectado! Processando...
```

### 3. **Processamento de Configurações**
```
📋 Dados da aba Configurações: [...]
🔍 Processando configuração: { ID: 'G1', Título: 'Prazo Decorrido', ... }
✅ Gráfico configurado: { id: 'G1', title: 'Prazo Decorrido', ... }
```

### 4. **Processamento de Dados**
```
🔄 Processando 1 linha(s) de dados...

📊 Linha 1: { ID_Gráfico: 'G1', Dataset: 'Série 1', ... }
   graphId: "G1", datasetName: "Série 1"
✅ Gráfico encontrado: G1
   Labels definidos: ['Prazo Decorrido', 'Prazo Restante']
   "Prazo Decorrido": 77.25 → 77.25
   "Prazo Restante": 22.75 → 22.75
   Valores extraídos: [77.25, 22.75]
✅ Dataset "Série 1" adicionado com 2 valores
```

### 5. **Processamento de Cores**
```
🎨 Processando 2 linha(s) de cores...

🎨 Cor 1: { ID_Gráfico: 'G1', Dataset: 'Série 1', Cor: '#d9d7f9', Rótulo: 'Prazo Decorrido' }
   graphId: "G1", dataset: "Série 1", cor: "#d9d7f9", rótulo: "Prazo Decorrido"
✅ Gráfico encontrado: G1, tipo: doughnut
✅ Dataset encontrado: Série 1
   É gráfico de pizza/rosca
   Labels do gráfico: ['Prazo Decorrido', 'Prazo Restante']
   Índice do rótulo "Prazo Decorrido": 0
   Array de cores inicializado: ['#8884d8', '#8884d8']
   ✅ Cor "#d9d7f9" aplicada ao índice 0
```

### 6. **Resumo dos Gráficos**
```
📊 RESUMO DOS GRÁFICOS PROCESSADOS:
   Total de gráficos: 1

   Gráfico G1:
      Título: Prazo Decorrido
      Tipo: doughnut
      Formato: percentage
      Labels: 2 (Prazo Decorrido, Prazo Restante)
      Datasets: 1
         Dataset 1: Série 1 (2 valores)
            Cores: ['#d9d7f9', '#4284D7']
```

### 7. **Importação no Supabase**
```
💾 INICIANDO IMPORTAÇÃO NO SUPABASE...

📤 Importando: "Prazo Decorrido"
   Dados: { title: 'Prazo Decorrido', chart_type: 'doughnut', ... }
   ➕ Criando novo indicador...
   ✅ Indicador criado com sucesso

✅ IMPORTAÇÃO CONCLUÍDA!
   Sucessos: 1
   Erros: 0
```

### 8. **Tratamento de Erros**
```
❌ ERRO CRÍTICO ao importar arquivo: Error: ...
Stack trace: ...
```

## Benefícios

✅ **Debug facilitado**: Identifica exatamente onde ocorre um problema  
✅ **Transparência**: Mostra cada etapa do processamento  
✅ **Validação**: Confirma que os dados estão sendo lidos corretamente  
✅ **Rastreamento**: Acompanha o fluxo completo dos dados  

## Como Usar

1. Abra o **Console do Navegador** (F12)
2. Vá para a aba **Console**
3. Clique em **Importar Excel** na aba Indicadores
4. Selecione o arquivo
5. Acompanhe os logs detalhados em tempo real

## Logs Importantes

### ⚠️ Avisos (Warnings)
- `⚠️ Linha sem ID, ignorando` - Linha de configuração sem ID
- `⚠️ Linha sem ID_Gráfico ou Dataset, ignorando` - Linha de dados incompleta
- `⚠️ Gráfico "X" não encontrado` - ID_Gráfico não existe nas configurações
- `⚠️ Dataset "X" não encontrado` - Dataset não existe no gráfico
- `⚠️ Dados incompletos, ignorando` - Linha de cores sem dados obrigatórios

### ❌ Erros (Errors)
- `❌ ERRO CRÍTICO ao importar arquivo` - Erro fatal no processamento
- `❌ Erro ao importar indicador` - Erro ao salvar no Supabase

## Arquivo Modificado

- **src/pages/ProjectDetails.jsx** - Função `handleImportFileChange()`
  - Linhas 2246-2612: Logs adicionados em todas as etapas
