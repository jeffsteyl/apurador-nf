export interface Emitente {
  nome: string;
  cnpj: string;
}

export interface Destinatario {
  nome: string;
  documento: string;
}

export interface NFeData {
  id: string;
  numero: number;
  serie: number;
  dataEmissao: string;
  emitente: Emitente;
  destinatario: Destinatario;
  cfop: number;
  operationCategory: string;
  valorTotal: number;
  status: 'Autorizada' | 'Cancelada';
}

export interface Filters {
  serie: string;
  cfop: string;
  status: string;
}
