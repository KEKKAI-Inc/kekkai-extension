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

export function addDocumentMessageListener(event: string,fn: (data?: any) => void) {
  document.addEventListener('KEKKAI_MESSAGE', (e: any) => {
    if (event === e.detail.event) {
      fn(e.detail.data);
    }
  });
}
