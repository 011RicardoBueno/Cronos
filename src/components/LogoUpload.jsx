import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { COLORS } from '../constants/dashboard';

export default function LogoUpload({ salonId, currentLogo, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentLogo);

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
      const { data, error: uploadError } = await supabase.storage
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
    <div style={styles.container}>
      <div style={styles.previewContainer}>
        {preview ? (
          <img src={preview} alt="Logo Preview" style={styles.logoImage} />
        ) : (
          <div style={styles.placeholder}>
            <ImageIcon size={32} color="#CBD5E1" />
          </div>
        )}
        
        {uploading && (
          <div style={styles.overlay}>
            <Loader2 className="animate-spin" color="white" size={24} />
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <label style={{...styles.uploadBtn, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1}}>
          <Upload size={16} />
          {uploading ? 'Processando...' : 'Alterar Logotipo'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        <p style={styles.hint}>Formatos aceitos: JPG, PNG, WebP. Máx: 200KB.</p>
      </div>
    </div>
  );
}

const styles = {
  container: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '20px', 
    padding: '16px', 
    backgroundColor: '#FFFFFF', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0',
    marginBottom: '10px'
  },
  previewContainer: { 
    position: 'relative', 
    width: '80px', 
    height: '80px', 
    borderRadius: '14px', 
    overflow: 'hidden', 
    backgroundColor: '#F8FAFC',
    border: '1px solid #F1F5F9'
  },
  logoImage: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  actions: { display: 'flex', flexDirection: 'column', gap: '6px' },
  uploadBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    padding: '10px 16px', 
    backgroundColor: COLORS.deepCharcoal, 
    color: 'white', 
    borderRadius: '10px', 
    fontSize: '13px', 
    fontWeight: '600', 
    transition: 'all 0.2s' 
  },
  hint: { margin: 0, fontSize: '11px', color: '#64748B' }
};