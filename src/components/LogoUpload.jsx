import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
export default function LogoUpload({ salonId, currentLogo, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentLogo);
  const { canUseCustomBranding } = usePlanFeatures();

  const isDisabled = uploading || !canUseCustomBranding;
  async function handleUpload(event) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // 1. Compressão para WebP (Reduzir consumo e aumentar velocidade)
      const options = {
        maxSizeMB: 0.15, // Apenas 150KB
        maxWidthOrHeight: 400,
        useWebWorker: true,
        fileType: 'image/webp'
      };

      const compressedFile = await imageCompression(file, options);

      // 2. Caminho único: salon_id/logo.webp
      // Usamos o nome fixo 'logo.webp' com upsert para não acumular lixo no storage
      const filePath = `${salonId}/logo.webp`;

      // 3. Upload para o Supabase Storage
      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, compressedFile, { 
          upsert: true,
          contentType: 'image/webp'
        });

      if (uploadError) {
        if (uploadError.message.includes('row-level security')) {
          throw new Error('Erro de permissão: Execute as políticas de RLS no SQL Editor.');
        }
        throw uploadError;
      }

      // 4. Obter a URL pública com cache buster para evitar carregar imagem antiga
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);
      
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      // 5. Atualizar a tabela salons no banco de dados
      const { error: updateError } = await supabase
        .from('salons')
        .update({ logo_url: finalUrl })
        .eq('id', salonId);

      if (updateError) throw updateError;

      setPreview(finalUrl);
      if (onUploadSuccess) onUploadSuccess(finalUrl);
      
    } catch (error) {
      console.error('Erro no upload:', error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-5 p-4 bg-brand-card rounded-2xl border border-brand-muted/10 mb-2.5">
      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-brand-surface border border-brand-muted/10">
        {preview ? (
          <img src={preview} alt="Logo Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={32} className="text-brand-muted/30" />
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="animate-spin" color="white" size={24} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={`flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-semibold transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}>
          <Upload size={16} />
          {uploading ? 'Processando...' : 'Alterar Logotipo'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={isDisabled}
            className="hidden"
          />
        </label>
        {!canUseCustomBranding 
          ? <p className="text-xs text-amber-500 font-bold">Disponível nos planos PRO</p>
          : <p className="text-xs text-brand-muted">Formatos: JPG, PNG, WebP. Máx: 200KB.</p>
        }
      </div>
    </div>
  );
}
