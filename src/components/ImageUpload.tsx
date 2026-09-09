import { useState, useRef } from 'react';
import { subirFotoAGoogleDrive, obtenerURLFotoDrive } from '../services/googleDriveService';
import { Camera, Upload, X, CheckCircle } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (driveId: string, previewUrl: string) => void;
  nombreEquipo: string;
  imagenActual?: string;
}

export default function ImageUpload({
  onImageUpload,
  nombreEquipo,
  imagenActual,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(imagenActual || null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modoCamara, setModoCamara] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    await subirFoto(file);
  };

  const subirFoto = async (file: File) => {
    try {
      setSubiendo(true);
      setError('');
      setExito(false);

      const imagenRedimensionada = await redimensionarImagen(file);
      const driveId = await subirFotoAGoogleDrive(imagenRedimensionada, nombreEquipo);
      const previewUrl = obtenerURLFotoDrive(driveId);

      onImageUpload(driveId, previewUrl);

      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      console.error('Error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error al subir la foto. Verifica tu conexion y permisos de Google Drive.'
      );
    } finally {
      setSubiendo(false);
    }
  };

  const redimensionarImagen = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          const maxHeight = 1200;

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const newFile = new File([blob], file.name, { type: 'image/jpeg' });
                resolve(newFile);
              } else {
                reject(new Error('Error redimensionando imagen'));
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Error cargando imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsDataURL(file);
    });
  };

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setModoCamara(true);
      }
    } catch (err) {
      setError('No se pudo acceder a la camara. Verifica los permisos del navegador.');
    }
  };

  const detenerCamara = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setModoCamara(false);
    }
  };

  const capturarFoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    canvasRef.current.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
        detenerCamara();
        await handleFileSelect(file);
      }
    }, 'image/jpeg');
  };

  return (
    <div className="space-y-4">
      {preview && (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          {exito && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-white">
                <CheckCircle size={48} />
                <span className="font-bold">Foto subida!</span>
              </div>
            </div>
          )}
        </div>
      )}

      {modoCamara && (
        <div className="space-y-2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-black"
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="flex gap-2">
            <button
              onClick={capturarFoto}
              disabled={subiendo}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-gray-400"
            >
              Capturar
            </button>
            <button
              onClick={detenerCamara}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!modoCamara && (
        <div className="flex gap-2">
          <button
            onClick={iniciarCamara}
            disabled={subiendo}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Camera size={20} />
            Camara
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendo}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Upload size={20} />
            Archivo
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {subiendo && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg">
          Subiendo foto a Google Drive...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <X size={20} />
          {error}
        </div>
      )}
    </div>
  );
}
