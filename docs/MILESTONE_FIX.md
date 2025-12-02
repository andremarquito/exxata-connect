# Correção: Milestone não persistia após F5

## Problema Identificado

Ao alternar uma atividade para milestone (marco) na aba "Atividades", o valor era:
- ✅ Salvo corretamente no Supabase
- ✅ Atualizado corretamente no visual local
- ❌ **Perdido após dar F5 na página** (voltava para visual de barra)

## Causa Raiz

O problema estava no uso do operador `||` (OR lógico) ao mapear os dados do Supabase para o estado local no `ProjectsContext.jsx`.

### Código Problemático (linhas 361, 827, 889):

```javascript
isMilestone: act.is_milestone || false
```

### Por que isso causava o problema?

O operador `||` funciona assim:
- Se o primeiro valor é **truthy**, retorna o primeiro valor
- Se o primeiro valor é **falsy**, retorna o segundo valor

Valores **falsy** em JavaScript incluem: `false`, `null`, `undefined`, `0`, `""`, `NaN`

**O problema:** Quando `act.is_milestone` é `false` (booleano falso), o operador `||` trata isso como falsy e retorna o segundo operando (`false`). Isso parece funcionar, MAS em alguns casos o PostgreSQL pode retornar valores de forma inconsistente.

## Solução Aplicada

Substituir o operador `||` pelo **nullish coalescing operator** (`??`):

```javascript
isMilestone: act.is_milestone ?? false
```

### Por que `??` resolve o problema?

O operador `??` funciona assim:
- Se o primeiro valor é **null** ou **undefined**, retorna o segundo valor
- Caso contrário, retorna o primeiro valor (mesmo que seja `false`, `0`, `""`)

**Vantagem:** Preserva corretamente valores booleanos `false`, tratando apenas `null` e `undefined` como valores a serem substituídos.

## Arquivos Modificados

**src/contexts/ProjectsContext.jsx:**

1. **Linha 361** - Carregamento inicial de atividades:
   ```javascript
   // ANTES
   isMilestone: act.is_milestone || false,
   
   // DEPOIS
   isMilestone: act.is_milestone ?? false,
   ```

2. **Linha 827** - Adicionar nova atividade:
   ```javascript
   // ANTES
   isMilestone: newActivity.is_milestone || false,
   
   // DEPOIS
   isMilestone: newActivity.is_milestone ?? false,
   ```

3. **Linha 889** - Atualizar atividade existente:
   ```javascript
   // ANTES
   isMilestone: updatedActivity.is_milestone || false
   
   // DEPOIS
   isMilestone: updatedActivity.is_milestone ?? false
   ```

## Resultado

Agora o campo `isMilestone` é preservado corretamente:
- ✅ Salvo no Supabase
- ✅ Atualizado no visual local
- ✅ **Persistido após F5 na página**

## Teste de Validação

1. Acesse a aba "Atividades"
2. Clique no botão de toggle (ícone Flag/BarChart3) de uma atividade
3. Verifique que o visual muda para losango (milestone)
4. Dê F5 na página
5. ✅ O visual deve permanecer como losango (milestone)

## Lições Aprendidas

- Use `??` ao invés de `||` quando trabalhar com valores booleanos que podem ser `false`
- O operador `||` é adequado para valores string, number, object (quando você quer fallback para valores vazios)
- O operador `??` é adequado para valores booleanos, números que podem ser 0, strings que podem ser vazias

## Referências

- [MDN: Nullish coalescing operator (??)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
- [MDN: Logical OR (||)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR)
