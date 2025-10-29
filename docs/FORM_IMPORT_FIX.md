# Correção: Botão "Importar" no Formulário de Indicadores

## Problema Identificado

O botão **"Importar Excel"** dentro do formulário de criação/edição de indicadores não estava funcionando corretamente:

- ❌ Só suportava o **formato antigo (1 aba)**
- ❌ Não processava o **formato novo (3 abas)**
- ❌ Não importava dados completos (labels, valores, cores)

## Solução Implementada

Atualizada a função `handleImportChange` do formulário para usar a **mesma lógica** da função principal `handleImportFileChange`.

### Funcionalidades Adicionadas:

#### 1. **Suporte ao Formato de 3 Abas**
```javascript
// Detecta automaticamente se é formato novo ou antigo
const hasConfigSheet = wb.SheetNames.includes('Configurações') || wb.SheetNames.includes('Configuracoes');
const hasDataSheet = wb.SheetNames.includes('Dados');
const hasColorSheet = wb.SheetNames.includes('Cores');

if (hasConfigSheet && hasDataSheet) {
  // Processa formato novo (3 abas)
} else {
  // Processa formato antigo (1 aba) - compatibilidade
}
```

#### 2. **Processamento Completo de Dados**

**Aba Configurações:**
- ✅ Título do gráfico
- ✅ Tipo de gráfico (bar, line, pie, doughnut, combo)
- ✅ Formato de valor (numérico, monetário BRL/USD, percentual)

**Aba Dados:**
- ✅ Labels (rótulos) extraídos automaticamente das colunas
- ✅ Datasets (séries de dados) com valores
- ✅ Múltiplos datasets suportados

**Aba Cores (opcional):**
- ✅ Cores por dataset (gráficos de barra, linha, combo)
- ✅ Cores por fatia (gráficos de pizza e rosca)
- ✅ Suporte a coluna "Rótulo" para identificar fatias específicas

#### 3. **Logs Detalhados**

Todos os logs são prefixados com `[FORMULÁRIO]` para facilitar identificação:

```
📥 [FORMULÁRIO] Iniciando importação...
📁 [FORMULÁRIO] Arquivo: g1_prazo_decorrido.xlsx
📋 [FORMULÁRIO] Abas encontradas: ['Configurações', 'Dados', 'Cores']
✅ [FORMULÁRIO] Formato 3 abas? true
✨ [FORMULÁRIO] Processando formato de 3 abas...
📋 [FORMULÁRIO] Configuração: { ID: 'G1', Título: 'Prazo Decorrido', ... }
📊 [FORMULÁRIO] Dados: [...]
🏷️ [FORMULÁRIO] Labels: ['Prazo Decorrido', 'Prazo Restante']
📈 [FORMULÁRIO] Datasets: [...]
🎨 [FORMULÁRIO] Cores: [...]
✅ [FORMULÁRIO] Importação concluída com sucesso!
```

#### 4. **Tratamento de Erros Robusto**

```javascript
catch (error) {
  console.error('❌ [FORMULÁRIO] Erro ao importar:', error);
  console.error('Stack trace:', error.stack);
  alert('Erro ao importar arquivo. Verifique se é um Excel válido.\n\nDetalhes: ' + error.message);
}
```

## Como Usar

### Opção 1: Importar no Formulário (Edição Individual)

1. Clique em **"Adicionar Indicador"** ou edite um indicador existente
2. No formulário, clique no botão **"Importar"** (canto superior direito)
3. Selecione um arquivo Excel (formato 3 abas ou 1 aba)
4. Os campos do formulário serão preenchidos automaticamente
5. Revise e clique em **"Salvar"**

**Vantagem:** Permite revisar e ajustar os dados antes de salvar

### Opção 2: Importar Diretamente (Importação em Lote)

1. Na aba **Indicadores**, clique em **"Importar Excel"** (fora do formulário)
2. Selecione um arquivo Excel (formato 3 abas)
3. Confirme a importação
4. Todos os gráficos são criados/atualizados automaticamente

**Vantagem:** Importa múltiplos gráficos de uma vez

## Compatibilidade

✅ **Formato Novo (3 abas):** Configurações, Dados, Cores  
✅ **Formato Antigo (1 aba):** Compatibilidade mantida  
✅ **Todos os tipos de gráfico:** bar, line, pie, doughnut, combo  
✅ **Todos os formatos de valor:** numérico, BRL, USD, percentual  
✅ **Cores personalizadas:** Por dataset ou por fatia  

## Exemplo de Uso

### Arquivo: `g1_prazo_decorrido.xlsx`

**Aba Configurações:**
```
| ID | Título          | Tipo     | Formato    |
|----|-----------------|----------|------------|
| G1 | Prazo Decorrido | doughnut | percentage |
```

**Aba Dados:**
```
| ID_Gráfico | Dataset  | Prazo Decorrido | Prazo Restante |
|------------|----------|-----------------|----------------|
| G1         | Série 1  | 77.25           | 22.75          |
```

**Aba Cores:**
```
| ID_Gráfico | Dataset  | Cor     | Rótulo          |
|------------|----------|---------|-----------------|
| G1         | Série 1  | #d9d7f9 | Prazo Decorrido |
| G1         | Série 1  | #4284D7 | Prazo Restante  |
```

**Resultado no Formulário:**
- Título: "Prazo Decorrido"
- Tipo: Rosca (doughnut)
- Formato: Percentual
- Labels: "Prazo Decorrido, Prazo Restante"
- Dataset 1: "Série 1" com valores "77.25, 22.75"
- Cores: #d9d7f9 e #4284D7 aplicadas às fatias

## Arquivo Modificado

- **src/pages/ProjectDetails.jsx**
  - Função `handleImportChange` (linhas 242-443)
  - Suporte completo ao formato de 3 abas
  - Logs detalhados com prefixo [FORMULÁRIO]
  - Tratamento de erros melhorado

## Testes Recomendados

1. ✅ Importar arquivo com 3 abas no formulário
2. ✅ Importar arquivo com 1 aba no formulário (compatibilidade)
3. ✅ Importar gráfico de pizza com cores por fatia
4. ✅ Importar gráfico de barras com múltiplos datasets
5. ✅ Verificar logs no console do navegador
6. ✅ Testar com diferentes formatos de valor (BRL, USD, %, numérico)
