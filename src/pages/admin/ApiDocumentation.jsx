import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Terminal, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CodeBlock = ({ children }) => {
  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(children).then(() => {
        toast.success('Exemplo copiado!');
      });
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl my-4 relative group">
      <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
        <code>{children}</code>
      </pre>
      <button 
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-2 bg-gray-700 rounded-lg text-gray-400 hover:bg-gray-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        title="Copiar"
      >
        <Copy size={16} />
      </button>
    </div>
  );
};

export default function ApiDocumentation() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <button onClick={() => navigate('/configuracoes')} className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text mb-4">
          <ArrowLeft size={16} />
          Voltar para Configurações
        </button>
        <h1 className="text-3xl font-black text-brand-text tracking-tight flex items-center gap-3">
          <Terminal className="text-brand-primary" />
          Documentação da API
        </h1>
        <p className="text-brand-muted mt-1">Guia para integrar o Cronos com suas ferramentas.</p>
      </header>

      <section className="bg-brand-card p-8 rounded-2xl border border-brand-muted/10">
        <h2 className="text-xl font-bold text-brand-text mb-2">Autenticação</h2>
        <p className="text-brand-muted mb-4">
          Para se autenticar na API do Cronos, você deve incluir sua chave de API no cabeçalho de cada requisição.
          A chave deve ser passada no header `Authorization` como um "Bearer Token".
        </p>
        <CodeBlock>
          Authorization: Bearer SUA_CHAVE_DE_API_AQUI
        </CodeBlock>
        <p className="text-xs text-brand-muted">
          Você pode gerar ou revogar sua chave de API na página de <a href="/configuracoes" className="text-brand-primary underline">Configurações</a>.
        </p>
      </section>

      <section className="bg-brand-card p-8 rounded-2xl border border-brand-muted/10">
        <h2 className="text-xl font-bold text-brand-text mb-2">Endpoints</h2>
        <p className="text-brand-muted mb-6">
          A seguir, alguns exemplos de como consultar os dados do seu salão. A URL base da API é: <code className="bg-brand-surface px-1 rounded">https://hmxwdblqsclsjjvctiwe.supabase.co/rest/v1/</code>
        </p>

        <div>
          <h3 className="font-bold text-brand-text">Listar Profissionais</h3>
          <p className="text-sm text-brand-muted mb-2">Retorna uma lista com todos os profissionais cadastrados no seu salão.</p>
          <p className="text-sm font-mono bg-brand-surface p-2 rounded-lg border border-brand-muted/10">
            <span className="font-bold text-green-400">GET</span> /professionals?select=*
          </p>
          <CodeBlock>
{`curl -X GET \\
  'https://hmxwdblqsclsjjvctiwe.supabase.co/rest/v1/professionals?select=*' \\
  -H 'apikey: SUPABASE_ANON_KEY' \\
  -H 'Authorization: Bearer SUA_CHAVE_DE_API_AQUI'`}
          </CodeBlock>
        </div>

        <div className="mt-8">
          <h3 className="font-bold text-brand-text">Listar Serviços</h3>
          <p className="text-sm text-brand-muted mb-2">Retorna uma lista com todos os serviços oferecidos pelo seu salão.</p>
          <p className="text-sm font-mono bg-brand-surface p-2 rounded-lg border border-brand-muted/10">
            <span className="font-bold text-green-400">GET</span> /services?select=*
          </p>
          <CodeBlock>
{`curl -X GET \\
  'https://hmxwdblqsclsjjvctiwe.supabase.co/rest/v1/services?select=*' \\
  -H 'apikey: SUPABASE_ANON_KEY' \\
  -H 'Authorization: Bearer SUA_CHAVE_DE_API_AQUI'`}
          </CodeBlock>
        </div>
        <p className="text-xs text-brand-muted mt-6 text-center">
          Nota: A `apikey` nos exemplos é a chave anônima pública do seu projeto Supabase. A segurança é garantida pela sua chave de API no header `Authorization`.
        </p>
      </section>
    </div>
  );
}