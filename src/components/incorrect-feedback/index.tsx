import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { getApis } from '@/constants/api';
import { IMAGE_PATH } from '@/constants/image-path';
import { useTranslate } from '@/hooks/use-translate-without-storage';
import { IncorrectFeedbackParams } from '@/types/incorrect-feedback';
import { TipInfo, TipType } from '@/types/tip';
import { collect } from '@/utils/mixpanel';

import styles from './index.style';
import { OperateTip } from '../common/operate-tip';

enum Status {
  PENDING = 'pending',
  INPUTTING = 'inputting',
  SUBMITTED = 'submitted',
}

const REMOTE_INCORRECT_FEEDBACK_IMG_PATH: Record<string, string> = {
  LOGO: IMAGE_PATH.LOGO_SAVE_FIREBASE,
  CLOSE: IMAGE_PATH.CORRECT_CLOSE,
  SUBMIT: IMAGE_PATH.CORRECT_SUBMIT,
  BTN_BG: IMAGE_PATH.CORRECT_BTN_BG,
};

const TT_NORMS_PRO_FONT_URL = 'https://fonts.cdnfonts.com/css/tt-norms-pro';

export function IncorrectFeedback({
  onClose,
  setting: { language, env },
  type,
  url,
  user: from = '',
  contract: address = '',
  simulation,
}: IncorrectFeedbackParams) {
  const { t } = useTranslate(language);
  const [status, setStatus] = useState<Status>(Status.PENDING);
  const [isShowIncorrect, setIsShowIncorrect] = useState<boolean>(false);
  const [tipControl, setTipControl] = useState<TipInfo>({
    isShow: false,
    type: TipType.SUCCESS,
    content: t('tip_submit.success'),
  });

  const trackDefendIncorrectFeedback = useCallback(
    (status: string) => {
      collect('defend_incorrect_feedback', {
        status,
        from,
        origin: url,
        address,
        type,
      });
    },
    [address, from, type, url],
  );

  const handleButtonMouseEnter = useCallback((e: any) => {
    e.target.style.border = 'none';
    e.target.style.background = `url(${REMOTE_INCORRECT_FEEDBACK_IMG_PATH.BTN_BG})`;
    e.target.style.color = '#FFFFFF';
    e.target.style.fontWeight = '700';
    e.target.style.backgroundSize = 'cover';
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setIsShowIncorrect(true);
    }, 500);
  }, []);

  useEffect(() => {
    for (const key in REMOTE_INCORRECT_FEEDBACK_IMG_PATH) {
      const img = new Image();
      img.src = REMOTE_INCORRECT_FEEDBACK_IMG_PATH[key];
    }
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'TT_Norms_Pro';
        src: url('${TT_NORMS_PRO_FONT_URL}');
      }
    `;
    document.head.appendChild(style);
  }, []);

  const handleButtonMouseLeave = useCallback((e: any) => {
    e.target.style.border = '1px solid #555555';
    e.target.style.background = '#F5F5F5';
    e.target.style.color = '#555555';
    e.target.style.fontWeight = '400';
  }, []);

  const skipIncorrectFeedback = useCallback(() => {
    setIsShowIncorrect(false);
    setTimeout(() => {
      onClose();
    }, 3000);
  }, [onClose]);

  const handleSubmitDefendIncorrectFeedback = useCallback(
    async (e: any) => {
      if (e.keyCode !== 13 || tipControl.type === TipType.LOADING) {
        tipControl.type === TipType.LOADING && e.preventDefault();
        return;
      }

      if (e.keyCode === 13) {
        e.stopPropagation();
        e.preventDefault();
      }

      setTipControl({ isShow: true, type: TipType.LOADING, content: t('tip_loading') });

      if (!e.target.value.trim()) {
        return setTipControl({ isShow: true, type: TipType.ERROR, content: t('tip_reason.not_fill') });
      }
      setIsShowIncorrect(false);
      axios
        .post((await getApis(env)).INCORRECT_FEEDBACK, {
          info: {
            reason: e.target.value,
            address,
            url,
            from,
            create_time: new Date().getTime(),
            msg: simulation?.msg,
          },
        })
        .then((res) => {
          const { code, msg } = res.data;
          if (code === 0 && msg === 'success') {
            setTipControl({ isShow: false, type: TipType.SUCCESS, content: t('tip_submit.success') });
            setStatus(Status.SUBMITTED);
            onClose();
          } else {
            setTipControl({ isShow: true, type: TipType.ERROR, content: t('tip_submit.error') });
          }
        })
        .catch((error) => {
          console.log(error);
          setTipControl({ isShow: true, type: TipType.ERROR, content: t('tip_submit.error') });
        });
    },
    [address, env, from, onClose, t, simulation, tipControl.type, url],
  );

  const confirmIsRightPopupBody = useMemo(() => {
    if (status === Status.PENDING) {
      return (
        <>
          <div style={styles.correctDes}>{t('correct_right.correct_des')}</div>
          <div style={styles.correctBtnContainer}>
            <div
              style={styles.correctBtn}
              onClick={() => {
                skipIncorrectFeedback();
                trackDefendIncorrectFeedback('correct');
              }}
              onMouseLeave={handleButtonMouseLeave}
              onMouseEnter={handleButtonMouseEnter}
            >
              {t('correct_right.correct_btn')}
            </div>
            <div
              style={styles.correctBtn}
              onClick={() => {
                setStatus(Status.INPUTTING);
                trackDefendIncorrectFeedback('incorrect');
              }}
              onMouseLeave={handleButtonMouseLeave}
              onMouseEnter={handleButtonMouseEnter}
            >
              {t('correct_right.incorrect_btn')}
            </div>
          </div>
        </>
      );
    }

    if (status === Status.INPUTTING) {
      return (
        <>
          <div style={{ ...styles.correctDes, ...styles.correctReasonDes }}>{t('correct_right.reason')}</div>
          <div style={{ position: 'relative' }}>
            <textarea style={styles.correctReason} onKeyDown={handleSubmitDefendIncorrectFeedback} />
            <img src={REMOTE_INCORRECT_FEEDBACK_IMG_PATH.SUBMIT} alt="" style={styles.correctSubmit} />
          </div>
        </>
      );
    }

    if (status === Status.SUBMITTED) {
      return <div style={styles.correctThanks}>{t('correct_right.submit_success')}</div>;
    }
  }, [
    handleButtonMouseEnter,
    handleSubmitDefendIncorrectFeedback,
    handleButtonMouseLeave,
    skipIncorrectFeedback,
    status,
    t,
    trackDefendIncorrectFeedback,
  ]);

  return (
    <div
      style={{ ...styles.incorrectFeedbackContainer, left: isShowIncorrect ? '10px' : '-400px' }}
      className="kekkai-incorrect-feedback-container"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          height: '24px',
          width: '100%',
          userSelect: 'none',
        }}
      >
        <img src={REMOTE_INCORRECT_FEEDBACK_IMG_PATH.LOGO} style={{ height: '33px', width: 'auto' }} alt="logo" />
      </div>

      {confirmIsRightPopupBody}

      <OperateTip tipInfo={tipControl} />

      {status !== Status.SUBMITTED && (
        <img
          src={REMOTE_INCORRECT_FEEDBACK_IMG_PATH.CLOSE}
          style={styles.closeCorrect}
          alt="close"
          onClick={() => {
            trackDefendIncorrectFeedback('skip');
            skipIncorrectFeedback();
          }}
        />
      )}
    </div>
  );
}
