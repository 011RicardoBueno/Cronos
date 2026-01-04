import React from 'react';
import { Zap, Key, Copy, Webhook } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsIntegrations({ currentPlan, values, setFieldValue, errors }) {
  const copyToClipboard = () => {
    if (values?.api_key) {
      navigator.clipboard.writeText(values.api_key);
      toast.success('Chave API copiada!');
    } else {
      toast.error('Nenhuma chave para copiar.');
    }
  };

  const generateKey = () => {
    // Gera uma chave aleatória simples no formato sk_...
    const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newKey = `sk_${randomPart}`;
    setFieldValue('api_key', newKey);
    toast.success('Nova chave gerada!');
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
          <Zap size={20} className="text-brand-primary" />
          Integrações & API
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie suas chaves de API para conectar o Cronos a outras ferramentas externas.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
            Chave de API
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Key className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="api_key"
                id="api_key"
                value={values?.api_key || ''}
                onChange={(e) => setFieldValue('api_key', e.target.value)}
                className="block w-full rounded-none rounded-l-md border-gray-300 pl-10 focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-2 border"
                placeholder="Gere uma chave para começar"
              />
            </div>
            <button
              type="button"
              onClick={copyToClipboard}
              className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <Copy className="h-4 w-4 text-gray-400" />
              <span>Copiar</span>
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Esta chave concede acesso total à API do seu estabelecimento. Mantenha-a segura.
          </p>
        </div>

        <div>
          <label htmlFor="webhook_url" className="block text-sm font-medium text-gray-700">
            Webhook URL
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Webhook className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="url"
                name="webhook_url"
                id="webhook_url"
                value={values?.webhook_url || ''}
                onChange={(e) => setFieldValue('webhook_url', e.target.value)}
                className={`block w-full rounded-md border-gray-300 pl-10 focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-2 border ${errors?.webhook_url ? 'border-red-500' : ''}`}
                placeholder="https://seu-sistema.com/webhook"
              />
            </div>
          </div>
          {errors?.webhook_url && <p className="mt-1 text-sm text-red-600">{errors.webhook_url}</p>}
          <p className="mt-2 text-sm text-gray-500">
            Receba notificações de novos agendamentos nesta URL.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={generateKey}
            className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium flex items-center gap-1"
          >
            Gerar nova chave aleatória
          </button>
        </div>
      </div>
    </div>
  );
}