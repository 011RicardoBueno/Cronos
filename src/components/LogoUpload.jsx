import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import { Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { COLORS } from '../constants/dashboard';

export default function LogoUpload({ salonId, currentLogo, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentLogo);

  async function handleUpload(event) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      
      // 1. Configurações de Compressão
      const options = {
        maxSizeMB: 0.2, // Máximo 200KB
        maxWidthOrHeight: 400, // Redimensiona para 400px
        useWebWorker: true,
        fileType: 'image/webp' // Converte para WebP (mais leve)
      };

      const compressedFile = await imageCompression(file, options);

      // 2. Caminho do arquivo (salão/logo_timestamp.webp)
      const fileExt = 'webp';
      const fileName = `${salonId}/logo_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // 3. Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // 4. Obter a URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // 5. Atualizar a tabela salons
      const { error: updateError } = await supabase
        .from('salons')
        .update({ logo_url: publicUrl })
        .eq('id', salonId);

      if (updateError) throw updateError;

      setPreview(publicUrl);
      if (onUploadSuccess) onUploadSuccess(publicUrl);
      alert('Logo atualizado com sucesso!');

    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.previewContainer}>
        {preview ? (
          <img src={preview} alt="Logo" style={styles.logoImage} />
        ) : (
          <div style={styles.placeholder}>
            <ImageIcon size={40} color="#ccc" />
          </div>
        )}
        
        {uploading && (
          <div style={styles.overlay}>
            <Loader2 className="animate-spin" color="white" />
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <label style={{...styles.uploadBtn, opacity: uploading ? 0.5 : 1}}>
          {uploading ? 'Enviando...' : (
            <>
              <Upload size={18} />
              Alterar Logo
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        <p style={styles.hint}>Recomendado: Quadrado, min. 400x400px.</p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', alignItems: 'center', gap: '25px', padding: '20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #eee' },
  previewContainer: { position: 'relative', width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #f0f0f0', backgroundColor: '#fafafa' },
  logoImage: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  actions: { display: 'flex', flexDirection: 'column', gap: '8px' },
  uploadBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: COLORS.deepCharcoal, color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' },
  hint: { margin: 0, fontSize: '12px', color: '#999' }
};