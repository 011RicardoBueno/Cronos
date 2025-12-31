# 🕒 Cronos - Gestão Inteligente para Salões e Profissionais

![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-green)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)

O **Cronos** é um sistema de agendamento e gestão multi-tenant projetado especificamente para o setor de beleza e bem-estar. O objetivo é simplificar a conexão entre profissionais e clientes através de uma interface intuitiva, dashboards de performance e automação de horários.

---

## 🚀 Funcionalidades Principais

### Para o Salão/Profissional
- **Multi-tenancy:** Isolamento completo de dados entre diferentes salões.
- **Dashboard de Performance:** Visualização clara de faturamento, novos clientes e taxa de ocupação.
- **Gestão de Equipe:** Controle de profissionais, serviços vinculados e horários individuais.
- **Configuração de Slots:** Algoritmo dinâmico para cálculo de disponibilidade baseado na duração de cada serviço.

### Para o Cliente
- **Onboarding Intuitivo:** Fluxo amigável para novos clientes.
- **Página de Agendamento Pública:** Cada estabelecimento possui um link exclusivo para reservas online.
- **Exploração de Serviços:** Navegação por categorias e profissionais.

---

## 🛠️ Tecnologias e Arquitetura

O projeto utiliza uma stack moderna focada em performance e escalabilidade:

- **Frontend:** [React](https://reactjs.org/) com [Vite](https://vitejs.dev/) para um desenvolvimento rápido e build otimizado.
- **Backend-as-a-Service:** [Supabase](https://supabase.com/) para autenticação, banco de dados PostgreSQL e tempo real.
- **Estilização:** CSS Modules para isolamento de escopo e design responsivo.
- **Qualidade de Código:** - [Jest](https://jestjs.io/) para testes unitários de lógica de negócio.
  - [ESLint](https://eslint.org/) para padronização de código.

---

## 📁 Estrutura de Pastas (Resumo)

```text
src/
├── components/    # Componentes UI reutilizáveis e layouts
├── context/       # Gerenciamento de estado global (Auth e Salon)
├── hooks/         # Lógica extraída (Cálculo de slots, filtros)
├── lib/           # Configurações de bibliotecas externas (Supabase)
├── pages/         # Páginas da aplicação (Admin e Client-side)
├── services/      # Comunicação direta com a API/Supabase
└── utils/         # Funções auxiliares e cálculos matemáticos