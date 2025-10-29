# Modelo de Importação/Exportação de Indicadores - 3 Abas

## Visão Geral

O sistema agora suporta importação e exportação de indicadores (gráficos) usando um formato de **3 abas** no Excel, tornando o processo mais intuitivo e visual, similar ao preenchimento de planilhas nativas do Excel.

---

## Formato do Arquivo Excel

O arquivo Excel deve conter **3 abas obrigatórias**:

1. **Configurações** - Informações gerais de cada gráfico
2. **Dados** - Valores dos datasets em formato tabular
3. **Cores** - Cores personalizadas para cada dataset (opcional)

---

## Aba 1: Configurações

Define as propriedades básicas de cada gráfico.

### Estrutura:

| ID | Título | Tipo | Formato |
|----|--------|------|---------|
| G1 | Resumo Histogramas no Período | bar | Numérico |
| G2 | Evolução de Vendas | line | Monetário |
| G3 | Distribuição por Setor | pie | Percentual |

### Campos:

- **ID** (obrigatório): Identificador único do gráfico (ex: G1, G2, G3...)
- **Título** (obrigatório): Nome do gráfico
- **Tipo** (obrigatório): Tipo do gráfico
  - `bar` - Gráfico de barras
  - `line` - Gráfico de linha
  - `pie` - Gráfico de pizza
  - `doughnut` - Gráfico de rosca
- **Formato** (opcional): Formato de exibição dos valores
  - `Numérico` - Números simples (ex: 1.234)
  - `Monetário BRL` - Valores em Real (ex: R$ 1.234,56)
  - `Monetário USD` - Valores em Dólar (ex: $ 1,234.56)
  - `Percentual` - Valores em porcentagem (ex: 45,6%)

---

## Aba 2: Dados

Contém os valores dos datasets em formato tabular (como uma tabela Excel normal).

### Estrutura:

| ID_Gráfico | Dataset | Contratado | Real | EQUIPAMENTO |
|------------|---------|------------|------|-------------|
| G1 | MOI | 2963 | 4011 | 5855 |
| G1 | MOD | 9951 | 10419 | 5855 |
| G2 | Vendas | 100000 | 150000 | 200000 |
| G2 | Custos | 50000 | 80000 | 120000 |
| G3 | Setor A | 45.5 | | |
| G3 | Setor B | 30.2 | | |
| G3 | Setor C | 24.3 | | |

### Campos:

- **ID_Gráfico** (obrigatório): Vincula os dados ao gráfico da aba Configurações
- **Dataset** (obrigatório): Nome da série de dados (ex: MOI, MOD, Vendas)
- **Colunas seguintes**: Cada coluna representa um rótulo (ex: Contratado, Real, EQUIPAMENTO)
  - Os valores devem ser numéricos
  - Células vazias são interpretadas como 0

### Observações:

- Cada linha representa um dataset (série de dados)
- As colunas após "Dataset" são os **rótulos** do gráfico
- Você pode ter quantas colunas quiser (rótulos dinâmicos)
- Para gráficos de pizza, geralmente há apenas uma coluna de valores

---

## Aba 3: Cores

Define cores personalizadas para cada dataset, com suporte a cores por fatia para gráficos de pizza/rosca.

### Estruturas possíveis:

1. **Cores por dataset (bar, line, etc.)**

| ID_Gráfico | Dataset | Cor |
|------------|---------|-----|
| G1 | MOI | #4284D7 |
| G1 | MOD | #D51D07 |
| G2 | Vendas | #82ca9d |
| G2 | Custos | #ffc658 |

2. **Cores por fatia (pie, doughnut)**

| ID_Gráfico | Dataset | Rótulo | Cor |
|------------|---------|--------|-----|
| G3 | Série 1 | Setor A | #4ade80 |
| G3 | Série 1 | Setor B | #facc15 |
| G3 | Série 1 | Setor C | #f87171 |

### Campos:

- **ID_Gráfico** (obrigatório): Vincula a cor ao gráfico
- **Dataset** (obrigatório): Nome do dataset (deve corresponder ao nome na aba Dados)
- **Rótulo** (opcional, recomendado para pizza/rosca): Nome da fatia/categoria
- **Cor** (obrigatório): Cor em formato hexadecimal (ex: #4284D7)

### Observações:

- Se não informar Rótulo para pizza/rosca, as cores serão aplicadas em ordem aos rótulos
- Se não informar cores, o sistema usará cores padrão
- Cores devem estar no formato hexadecimal (#RRGGBB)

---

## Exemplo Completo

### Gráfico de Barras - Resumo Histogramas

**Configurações:**
| ID | Título | Tipo | Formato |
|----|--------|------|---------|
| G1 | Resumo Histogramas no Período | bar | Numérico |

**Dados:**
| ID_Gráfico | Dataset | Contratado | Real | EQUIPAMENTO |
|------------|---------|------------|------|-------------|
| G1 | MOI | 2963 | 4011 | 5855 |
| G1 | MOD | 9951 | 10419 | 5855 |

**Cores:**
| ID_Gráfico | Dataset | Rótulo | Cor |
|------------|---------|--------|-----|
| G1 | Série 1 | Contratado | #4284D7 |
| G1 | Série 1 | Real | #D51D07 |
| G1 | Série 1 | EQUIPAMENTO | #82ca9d |

**Resultado:** Gráfico de barras com 3 categorias (Contratado, Real, EQUIPAMENTO) e 2 séries de dados (MOI em azul, MOD em vermelho).

---

## Vantagens do Novo Formato

✅ **Intuitivo**: Preenche como uma tabela Excel normal
✅ **Visual**: Vê exatamente como ficará o gráfico
✅ **Sem erros**: Não precisa se preocupar com vírgulas e separadores
✅ **Flexível**: Aceita qualquer número de colunas/linhas
✅ **Múltiplos gráficos**: Importa vários gráficos de uma vez
✅ **Cores opcionais**: Define cores personalizadas ou usa padrão

---

## Como Usar

### Exportar:

1. Acesse a aba **Indicadores** do projeto
2. Clique no botão **Exportar Excel**
3. O arquivo será baixado com todos os indicadores em formato de 3 abas

### Importar:

1. Prepare seu arquivo Excel com as 3 abas (Configurações, Dados, Cores)
2. Acesse a aba **Indicadores** do projeto
3. Clique no botão **Importar Excel**
4. Selecione o arquivo
5. Confirme a importação
6. Os gráficos serão criados/atualizados automaticamente

---

## Compatibilidade

O sistema mantém **compatibilidade com o formato antigo** (1 aba única). Se você importar um arquivo no formato antigo, ele será processado automaticamente.

---

## Dicas

- Use IDs sequenciais (G1, G2, G3...) para facilitar a organização
- Mantenha os nomes dos datasets consistentes entre as abas Dados e Cores
- Para gráficos de pizza, use apenas uma coluna de valores na aba Dados
- Deixe células vazias para valores zero
- Use cores em hexadecimal para melhor compatibilidade

---

## Suporte

Em caso de dúvidas ou problemas na importação:
- Verifique se as 3 abas estão nomeadas corretamente
- Confirme que os IDs estão consistentes entre as abas
- Valide que os valores numéricos não contêm caracteres especiais
- Certifique-se de que as cores estão no formato hexadecimal (#RRGGBB)
