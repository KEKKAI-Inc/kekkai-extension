import React, { useMemo } from 'react';

import { useLink } from '@/hooks/use-link';
import { useTranslate } from '@/hooks/use-translate';
import { Link } from '@/types/link';
import { Lang } from '@/types/setting';
import { openLink } from '@/utils/open-link';

export function Feedback({ prefixText }: { prefixText: string }) {
  const { t, language } = useTranslate();
  const { links } = useLink();

  const content = useMemo(() => {
    if (!links.feedback) {
      return null;
    }

    const feedback = (
      <span
        style={{ color: '#F4BF4F', textDecoration: 'underline', cursor: 'pointer' }}
        onClick={() => {
          openLink(Link.FEEDBACK, `${links.feedback}?language=${language}#feedback`);
        }}
      >
        {t('feedback.feedback')}
      </span>
    );
    const handbook = (
      <span
        style={{ color: '#3772CD', textDecoration: 'underline', cursor: 'pointer' }}
        onClick={() => {
          openLink(Link.HANDBOOK, links.handbook);
        }}
      >
        {t('feedback.handbook')}
      </span>
    );

    if (!links.handbook) {
      if (language === Lang.JA) {
        return (
          <>
            {feedback}
            {t('feedback.dot')}
          </>
        );
      }
      return (
        <>
          {t('feedback.goto')}
          {feedback}
          {t('feedback.dot')}
        </>
      );
    }

    if (language === Lang.JA) {
      return (
        <>
          {handbook}
          {t('feedback.see')}
          {feedback}
          {t('feedback.or')}
          {t('feedback.dot')}
        </>
      );
    }

    return (
      <>
        {t('feedback.see')}
        {handbook}
        {t('feedback.or')}
        {feedback}
        {t('feedback.dot')}
      </>
    );
  }, [language, links.feedback, links.handbook, t]);

  if (!links.feedback && !links.handbook) {
    return null;
  }

  return (
    <div
      className="kekkai-feedback"
      style={{ color: '#A5A5A5', fontSize: '12px', marginTop: '12px', textAlign: 'center' }}
    >
      {prefixText}
      {content}
    </div>
  );
}
