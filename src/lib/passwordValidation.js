/**
 * Validação de senha compartilhada para toda a aplicação
 * Garante consistência entre reset de senha e alteração de senha
 */

/**
 * Valida a força da senha
 * @param {string} password - Senha a ser validada
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('uma letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('um número');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Retorna mensagem de erro formatada
 * @param {string[]} errors - Array de erros
 * @returns {string} - Mensagem formatada
 */
export const getPasswordErrorMessage = (errors) => {
  if (errors.length === 0) return '';
  return `A senha deve ter ${errors.join(', ')}`;
};

/**
 * Requisitos de senha para exibição ao usuário
 */
export const PASSWORD_REQUIREMENTS = [
  'Pelo menos 8 caracteres',
  'Uma letra maiúscula',
  'Uma letra minúscula',
  'Um número'
];

/**
 * Calcula a força da senha (0-4)
 * @param {string} password - Senha a ser avaliada
 * @returns {number} - Força da senha (0 = muito fraca, 4 = forte)
 */
export const getPasswordStrength = (password) => {
  if (!password) return 0;
  
  let strength = 0;
  
  // Comprimento
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  
  // Complexidade
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++; // Caracteres especiais
  
  return Math.min(strength, 4);
};

/**
 * Retorna label e cor para a força da senha
 * @param {number} strength - Força da senha (0-4)
 * @returns {Object} - { label: string, color: string }
 */
export const getPasswordStrengthLabel = (strength) => {
  const labels = {
    0: { label: 'Muito fraca', color: '#dc2626' },
    1: { label: 'Fraca', color: '#ea580c' },
    2: { label: 'Razoável', color: '#f59e0b' },
    3: { label: 'Boa', color: '#84cc16' },
    4: { label: 'Forte', color: '#22c55e' }
  };
  
  return labels[strength] || labels[0];
};
