export function sendDocumentMessage(event: string, data?: any) {
  document.dispatchEvent(
    new CustomEvent('KEKKAI_MESSAGE', {
      detail: {
        event,
        data,
      },
    }),
  );
}

export function addDocumentMessageListener(event: string,fn: (data?: any) => void): () => void {
  const handler = (e: any) => {
    if (event === e.detail?.event) {
      fn(e.detail.data);
    }
  };
  document.addEventListener('KEKKAI_MESSAGE', handler);
  return () => document.removeEventListener('KEKKAI_MESSAGE', handler);
}
