const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_DRIVE_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let accessToken: string | null = null;
let tokenClient: any = null;
let googleLoaded = false;

// Cargar Google Identity Services
const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (googleLoaded && (window as any).google) {
      resolve();
      return;
    }

    if (document.querySelector('script[src*="gsi/client"]')) {
      // El script ya existe, solo esperar a que cargue
      const checkGoogle = setInterval(() => {
        if ((window as any).google?.accounts?.oauth2) {
          clearInterval(checkGoogle);
          googleLoaded = true;
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkGoogle);
        if (!(window as any).google?.accounts?.oauth2) {
          reject(new Error('Google API no cargó'));
        }
      }, 5000);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error('No se pudo cargar Google API'));
    };

    document.body.appendChild(script);
  });
};

export const initializeGoogleDrive = async () => {
  try {
    await loadGoogleScript();

    if (!tokenClient && (window as any).google?.accounts?.oauth2) {
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            accessToken = response.access_token;
          }
        },
      });
    }
  } catch (err) {
    console.error('Error inicializando Google Drive:', err);
  }
};

export const requestGoogleDriveAccess = (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (accessToken) {
        resolve(accessToken);
        return;
      }

      // Asegurar que Google está inicializado
      await initializeGoogleDrive();

      if (!tokenClient) {
        reject(new Error('Google no está disponible. Recarga la página.'));
        return;
      }

      // Callback para cuando se obtiene el token
      const callback = (response: any) => {
        if (response.access_token) {
          accessToken = response.access_token;
          resolve(response.access_token);
        } else if (response.error) {
          reject(new Error(response.error));
        }
      };

      // Actualizar el callback del token client
      tokenClient.callback = callback;

      // Solicitar acceso
      tokenClient.requestAccessToken({ prompt: 'consent' });

      // Timeout de 30 segundos
      setTimeout(() => {
        if (!accessToken) {
          reject(new Error('Timeout solicitando acceso a Google Drive'));
        }
      }, 30000);
    } catch (err) {
      reject(err);
    }
  });
};

export const subirFotoAGoogleDrive = async (
  file: File,
  nombreEquipo: string
): Promise<string> => {
  try {
    const token = await requestGoogleDriveAccess();

    const metadata = {
      name: `${nombreEquipo}-${Date.now()}.jpg`,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
      mimeType: 'image/jpeg',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ Authorization: `Bearer ${token}` }),
      body: form,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error al subir archivo');
    }

    const result = await response.json();

    // Hacer el archivo publico para que cualquiera pueda ver la foto.
    // Sin esto, solo la ve quien esta logueado con la cuenta duena del archivo.
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
        method: 'POST',
        headers: new Headers({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      });
    } catch (permErr) {
      // Si falla el permiso, la foto igual quedo subida.
      console.error('No se pudo hacer publica la foto:', permErr);
    }

    return result.id;
  } catch (err) {
    console.error('Error subiendo a Google Drive:', err);
    throw err;
  }
};

export const obtenerURLFotoDrive = (driveId: string): string => {
  return `https://drive.google.com/uc?export=view&id=${driveId}`;
};

export const obtenerURLDescargaDrive = (driveId: string): string => {
  return `https://drive.google.com/uc?export=view&id=${driveId}`;
};
