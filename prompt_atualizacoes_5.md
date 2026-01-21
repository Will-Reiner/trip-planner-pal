 - ainda nao consigo acessar a lista de mercado e tambem agora, ao clicar em nova refeicao, vai pra tela branca tambem.
 - os itens essenciais agora quando uma pessoa risca um, risca pra todas.
 
 - perguntas:
 Criação inicial do admin:

Como será criado o primeiro usuário admin? atraves de um seed por enquanto.
Fluxo de criação de membros:

O admin deve criar o perfil completo do membro (nome, avatar, título engraçado) OU apenas criar o login e o membro completa depois? apenas o nome e senha e se sera admin tambem.
Membros podem editar seu próprio perfil depois? sim.
Permissões diferenciadas:

Quais funcionalidades só o admin pode fazer? Sugestões:
✅ Criar/remover usuários SIM
✅ Deletar refeições de qualquer pessoa SIM
✅ Deletar itens de qualquer pessoa SIM
❓ Gerenciar orçamento SIM
❓ Editar perfis de outros usuários SIM
Membros podem fazer tudo exceto gerenciar usuários? SIM
Autenticação:

Quer usar JWT (token) ou sessão? JWT.
Sessão deve expirar após quanto tempo? nao precisa expirar.
Precisa de "lembrar-me" / "manter conectado"? nao, pois nao vai expirar.
Quer funcionalidade de "esqueci minha senha"? nao.
Transição do sistema atual:

Os usuários existentes viram membros ou admins? pode apagar todos e crie uma seed para o usuario com nome Will para admin, a senha pode ser "ultramegasuperpassword123".
Como lidar com dados existentes (refeições, itens criados por usuários sem senha)? pode apagar tudo, ainda esta em teste.
Interface:

Tela de login antes de tudo? sim.
Admin tem uma página especial de gerenciamento de usuários? tera mais pra frente, agora nao.
Mostrar algum indicador visual de quem é admin (badge, cor diferente)? sim. ele deve ter uma aparencia foda!!