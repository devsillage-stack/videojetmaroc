import React from 'react';
import { Modal } from './Modal.js';
import { Printer, Download } from 'lucide-react';
import { Machine } from '../../types/index.js';

interface QRCodeModalProps {
  machine: Machine | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ machine, isOpen, onClose }) => {
  if (!machine) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code SAV - ${machine.serialNumber}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            .badge { border: 2px solid #002B49; padding: 20px; border-radius: 12px; display: inline-block; }
            h2 { color: #002B49; margin: 0 0 10px 0; font-size: 20px; }
            p { margin: 4px 0; color: #475569; font-size: 14px; }
            img { width: 220px; height: 220px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="badge">
            <h2>VIDEOJET MAROC — FICHE SAV</h2>
            <p><strong>N° Série:</strong> ${machine.serialNumber}</p>
            <p><strong>Modèle:</strong> ${machine.model.name}</p>
            <p><strong>Client:</strong> ${machine.client.name}</p>
            <img src="${machine.qrCodeData}" alt="QR Code" />
            <p style="font-size: 11px; color: #94a3b8;">Scannez pour déclarer un incident ou consulter le carnet de maintenance</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`QR Code SAV : ${machine.serialNumber}`}
      subtitle={`${machine.model.name} — ${machine.client.name}`}
      maxWidth="md"
    >
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-inner">
          {machine.qrCodeData ? (
            <img
              src={machine.qrCodeData}
              alt={`QR Code ${machine.serialNumber}`}
              className="w-56 h-56 object-contain"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400">
              Aucun QR code disponible
            </div>
          )}
        </div>

        <div className="text-center text-xs text-slate-500">
          Ce QR code est destiné à être imprimé et collé sur le châssis de la machine pour un accès immédiat des techniciens et opérateurs d'usine.
        </div>

        <div className="flex items-center gap-3 w-full pt-3 border-t border-slate-100">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-videojet-blue text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimer l'étiquette
          </button>
          <a
            href={machine.qrCodeData}
            download={`QR-${machine.serialNumber}.png`}
            className="inline-flex items-center justify-center p-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            title="Télécharger PNG"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    </Modal>
  );
};
