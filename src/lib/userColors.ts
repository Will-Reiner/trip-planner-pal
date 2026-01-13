// Cores fixas para os 15 usuários
const USER_COLORS: Record<number, string> = {
  1: '#FF6B6B',  // Vermelho coral
  2: '#4ECDC4',  // Turquesa
  3: '#45B7D1',  // Azul céu
  4: '#FFA07A',  // Salmão
  5: '#98D8C8',  // Verde menta
  6: '#F7DC6F',  // Amarelo dourado
  7: '#BB8FCE',  // Roxo claro
  8: '#F8B4D9',  // Rosa claro
  9: '#85C1E2',  // Azul bebê
  10: '#F5B7B1', // Pêssego
  11: '#D7BDE2', // Lavanda
  12: '#A3E4D7', // Água-marinha
  13: '#FAD7A0', // Bege dourado
  14: '#EDBB99', // Laranja pálido
  15: '#AED6F1', // Azul céu claro
};

export const getUserColor = (userId: number | null): string => {
  if (!userId) return '#FF6B6B';
  return USER_COLORS[userId] || '#FF6B6B';
};
