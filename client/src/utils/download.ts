export const downloadExport = async (endpoint: string, defaultFilename: string) => {
  try {
    const token = localStorage.getItem('vj_token');
    const baseUrl = (import.meta as any).env?.VITE_API_URL || '/api';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `${baseUrl}${cleanEndpoint}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      throw new Error(errorJson?.error || 'Erreur lors du téléchargement du document');
    }

    // Extract filename from Content-Disposition if present
    let filename = defaultFilename;
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err: any) {
    alert(err.message || 'Échec du téléchargement');
  }
};
