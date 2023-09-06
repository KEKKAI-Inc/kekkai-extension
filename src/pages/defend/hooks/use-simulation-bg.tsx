import { useEffect, useState } from 'react';
import { IMAGE_PATH } from '../../../constants/image-path';
import { emitter } from '../../../utils/emitter';
import { DefendParams } from '../../../types/defend';

export function useSimulationBg(type: DefendParams['type']) {
  const [ inputBg, setInputBg ] = useState<string>();
  const [ outputBg, setOutputBg ] = useState<string>();
  
  useEffect(() => {
    if (type !== 'transaction') {
      return;
    }

    const handler = (({ type, logo }: {
      type: -1 | 1;
      logo: string;
    }) => {
      if (logo === IMAGE_PATH.LOGO_LARGE || IMAGE_PATH.TOKEN_LOGO_DEFAULT.includes(logo)) {
        return;
      }
      if (type === 1 && !inputBg) {
        setInputBg(logo);
      } else if (type === -1 && !outputBg) {
        setOutputBg(logo);
      }
    });
    emitter.on('token_image_load', handler);
    return () => emitter.off('token_image_load', handler);
  }, [inputBg, outputBg, type]);

  return {
    inputBg,
    outputBg,
  };
}