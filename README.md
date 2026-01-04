# Cronos บริหารจัดการ

**Cronos** é um sistema de gestão (SaaS) completo para salões de beleza, barbearias e estúdios. A plataforma foi desenhada para centralizar a gestão de agendamentos, clientes, finanças e operações do dia a dia, fornecendo ao mesmo tempo uma experiência de agendamento simples e moderna para o cliente final.

![Placeholder para Screenshot da Dashboard](https://via.placeholder.com/800x400.png?text=Insira+um+screenshot+da+dashboard+aqui)

---

## ✨ Funcionalidades Principais

O sistema é dividido em dois ecossistemas principais: o painel de gestão para o administrador e a área do cliente.

### 👨‍💼 Painel do Administrador

*   **Dashboard de Negócios:** Visão geral com as principais métricas e atividades do salão.
*   **Gestão de Agenda:** Calendário completo para visualizar e gerenciar todos os agendamentos.
*   **Gestão de Serviços e Produtos:** Cadastro e edição de serviços e produtos oferecidos, com base para futuro controle de estoque.
*   **Gestão de Profissionais:** Adicione e gerencie os profissionais da sua equipe.
*   **CRM de Clientes:** Base de clientes com potencial para histórico de visitas e segmentação.
*   **Painel de Fila de Espera:** Exiba uma fila de atendimento em tempo real no seu estabelecimento.
*   **Módulo Financeiro:** Acompanhe o fluxo de caixa e analise o desempenho com gráficos e relatórios.

### 💇‍♀️ Área do Cliente

*   **Exploração e Descoberta:** Encontre salões e serviços disponíveis.
*   **Agendamento Simplificado:** Marque horários de forma rápida e intuitiva.
*   **Meus Agendamentos:** Visualize e gerencie seus próprios horários marcados.
*   **Feedback:** Avalie os serviços prestados após o atendimento.

---

## 🚀 Tecnologias Utilizadas

*   **Frontend:** React, Vite, Tailwind CSS
*   **Backend & Banco de Dados:** Supabase
*   **Roteamento:** React Router
*   **Gerenciamento de Estado:** React Context
*   **Ícones:** Lucide React
*   **Estilização:** PostCSS, Radix UI (inferido)

---

## 🏁 Começando

Para rodar este projeto localmente, siga os passos abaixo.

### Pré-requisitos

*   Node.js (v18 ou superior)
*   npm ou yarn

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/cronos.git
    cd cronos
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env.local` na raiz do projeto, copiando o exemplo de `.env.example` (se existir). Você precisará preencher com as suas chaves do Supabase.
    ```
    VITE_SUPABASE_URL=SUA_URL_DO_SUPABASE
    VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_DO_SUPABASE
    ```

4.  **Rode o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

    Abra [http://localhost:5173](http://localhost:5173) no seu navegador para ver o resultado.

---

## 🔮 Próximos Passos e Melhorias

Este projeto tem uma base sólida, mas ainda há espaço para evoluir. Algumas funcionalidades planejadas ou sugeridas incluem:

*   [ ] **Gestão de Estoque:** Implementar o controle de baixa de produtos.
*   [ ] **Controle de Acesso por Papel (RBAC):** Criar perfis `Gerente` e `Profissional` com diferentes níveis de permissão.
*   [ ] **Notificações Automáticas:** Lembretes de agendamento por E-mail ou WhatsApp.
*   [ ] **CRM Avançado:** Detalhamento do perfil do cliente com histórico completo e segmentação para marketing.
*   [ ] **Análise de Desempenho:** Métricas de retenção, performance por profissional e popularidade de serviços.

---

## 📄 Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

Feito com ❤️ por [Seu Nome](https://github.com/seu-usuario)
