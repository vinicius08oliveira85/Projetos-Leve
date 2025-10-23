import { Blob } from '@google/genai';

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const formatDateDdMmYy = (dateString?: string): string => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return 'N/A';
    const [year, month, day] = dateString.split('-');
    const shortYear = year.slice(-2);
    return `${day}/${month}/${shortYear}`;
};

export const formatDateTimeDdMmYy = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};


export const calculateDaysWaiting = (sinceDate?: string): number | string => {
    if (!sinceDate || !/^\d{4}-\d{2}-\d{2}$/.test(sinceDate)) return 'N/A';
    const today = new Date('2025-08-24T12:00:00Z');
    const [year, month, day] = sinceDate.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day));
    const diffTime = today.getTime() - startDate.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

export const calculatePermanencia = (dataIH?: string, altaFim?: string): string => {
    if (!dataIH || !/^\d{4}-\d{2}-\d{2}$/.test(dataIH)) return 'N/A';

    const today = new Date('2025-08-24T12:00:00Z');
    
    const startDate = new Date(dataIH);
    // Use altaFim if provided and valid, otherwise use today
    const endDate = (altaFim && /^\d{4}-\d{2}-\d{2}$/.test(altaFim)) ? new Date(altaFim) : today;

    // Set time to 0 to compare dates only
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - startDate.getTime();
    
    if (diffTime < 0) return '0 dias';
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} dias`;
};


export const calculateDaysBetween = (startDateStr?: string, endDateStr?: string): string => {
    if (!startDateStr || !endDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(startDateStr) || !/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) {
        return 'N/A';
    }
    const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
    const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
    const startDate = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    const endDate = new Date(Date.UTC(eYear, eMonth - 1, eDay));
    const diffTime = endDate.getTime() - startDate.getTime();

    if (diffTime < 0) return 'Data inválida';

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} dias`;
};