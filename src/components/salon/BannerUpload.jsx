import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import imageCompression from 'browser-image-compression';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';

export default function BannerUpload({ salonId, currentBanner, onUploadSuccess, plan }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentBanner);

  const isPro = plan === 'pro';
  const isDisabled = uploading || !isPro;

  async function handleUpload(event) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      
      const options = {
        maxSizeMB: 0.3, // 300KB for banner
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp'
      };

      const compressedFile = await imageCompression(file, options);
      const filePath = `${salonId}/banner.webp`;

      const { error: uploadError } = await supabase.storage
        .from('banners') // Upload to 'banners' bucket
        .upload(filePath, compressedFile, { 
          upsert: true,
          contentType: 'image/webp'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);
      
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from('salons')
        .update({ banner_url: finalUrl })
        .eq('id', salonId);

      setPreview(finalUrl);
      if (onUploadSuccess) onUploadSuccess(finalUrl);
      
    } catch (error) {
      console.error('Erro no upload do banner:', error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-muted/10 p-4">
      <label className="text-xs font-bold text-brand-muted uppercase mb-2 block">Imagem do Banner</label>
      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-brand-surface border border-brand-muted/10 mb-4">
        {preview ? <img src={preview} alt="Banner Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={40} className="text-brand-muted/30" /></div>}
        {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin" color="white" size={24} /></div>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-semibold transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}>
          <Upload size={16} />
          {uploading ? 'Enviando...' : 'Alterar Banner'}
          <input type="file" accept="image/*" onChange={handleUpload} disabled={isDisabled} className="hidden" />
        </label>
        {!isPro 
          ? <p className="text-xs text-amber-500 font-bold text-center">Disponível no Plano Pro</p>
          : <p className="text-xs text-brand-muted text-center">Recomendado: 1200x400px. Máx: 300KB.</p>
        }
      </div>
    </div>
  );
}