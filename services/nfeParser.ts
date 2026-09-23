import { NFeData } from '../types';

export const getOperationCategory = (cfop: number): string => {
  const s = cfop.toString();
  if (s.startsWith('12') || s.startsWith('22') || s.startsWith('52') || s.startsWith('62') ||
    s.startsWith('141') || s.startsWith('241') || s.startsWith('541') || s.startsWith('641')) {
    return 'Devolução';
  }
  if (s.startsWith('115') || s.startsWith('215') || s.startsWith('515') || s.startsWith('615') ||
    s.startsWith('140') || s.startsWith('240') || s.startsWith('540') || s.startsWith('640') ||
    s.startsWith('155') || s.startsWith('255') || s.startsWith('555') || s.startsWith('655') ||
    s === '6949' || s === '5905' || s === '6905') {
    return 'Transferência';
  }
  if (s.startsWith('1') || s.startsWith('2') || s.startsWith('3')) {
    return 'Entrada';
  }
  if (s.startsWith('5') || s.startsWith('6') || s.startsWith('7')) {
    return 'Saída';
  }
  return 'Outro';
};

const getTextContent = (parent: Element, tagName: string): string => {
  const element = parent.getElementsByTagName(tagName)[0];
  return element?.textContent?.trim() || '';
};

export const parseNFeXML = async (file: File): Promise<NFeData> => {
  const fileContent = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(fileContent, 'application/xml');
  if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
    throw new Error(`[${file.name}] Não é um arquivo XML válido.`);
  }
  const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];
  if (!infNFe) {
    throw new Error(`[${file.name}] Tag <infNFe> não encontrada. O arquivo é uma NFe válida?`);
  }
  try {
    const ide = infNFe.getElementsByTagName('ide')[0];
    const emit = infNFe.getElementsByTagName('emit')[0];
    const dest = infNFe.getElementsByTagName('dest')[0];
    const det = infNFe.getElementsByTagName('det')[0];
    const total = infNFe.getElementsByTagName('total')[0];
    const icmsTot = total.getElementsByTagName('ICMSTot')[0];
    if (!ide || !emit || !dest || !det || !icmsTot) {
      throw new Error(`[${file.name}] Estrutura do XML da NFe incompleta.`);
    }
    const prod = det.getElementsByTagName('prod')[0];
    if (!prod) {
      throw new Error(`[${file.name}] Tag <prod> não encontrada dentro de <det>.`);
    }
    const cfop = parseInt(getTextContent(prod, 'CFOP'), 10);
    const eventos = xmlDoc.getElementsByTagName('procEventoNFe');
    let isCancelled = false;
    for (const evento of Array.from(eventos)) {
      const tpEvento = evento.getElementsByTagName('tpEvento')[0]?.textContent?.trim();
      if (tpEvento === '110111') {
        const retEvento = evento.getElementsByTagName('retEvento')[0];
        if (retEvento) {
          const cStat = retEvento.getElementsByTagName('cStat')[0]?.textContent?.trim();
          if (cStat === '135') {
            isCancelled = true;
            break;
          }
        }
      }
    }
    const nfeData: NFeData = {
      id: infNFe.getAttribute('Id') || `NFe_${Date.now()}_${Math.random()}`,
      numero: parseInt(getTextContent(ide, 'nNF'), 10),
      serie: parseInt(getTextContent(ide, 'serie'), 10),
      dataEmissao: getTextContent(ide, 'dhEmi'),
      emitente: {
        nome: getTextContent(emit, 'xNome'),
        cnpj: getTextContent(emit, 'CNPJ'),
      },
      destinatario: {
        nome: getTextContent(dest, 'xNome'),
        documento: getTextContent(dest, 'CNPJ') || getTextContent(dest, 'CPF'),
      },
      cfop: cfop,
      operationCategory: getOperationCategory(cfop),
      valorTotal: parseFloat(getTextContent(icmsTot, 'vNF')),
      status: isCancelled ? 'Cancelada' : 'Autorizada',
    };
    if (isNaN(nfeData.numero) || isNaN(nfeData.serie) || isNaN(nfeData.cfop) || isNaN(nfeData.valorTotal)) {
      throw new Error(`[${file.name}] Falha ao converter valores numéricos da NFe.`);
    }
    return nfeData;
  } catch (error) {
    console.error(`Erro ao processar o arquivo ${file.name}:`, error);
    if (error instanceof Error) {
      throw new Error(`[${file.name}] Erro na extração de dados: ${error.message}`);
    }
    throw new Error(`[${file.name}] Erro desconhecido durante o processamento.`);
  }
};
