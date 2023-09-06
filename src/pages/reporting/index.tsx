import axios from 'axios';
import { ethers } from 'ethers';
import { cloneDeep } from 'lodash-es';
import { nanoid } from 'nanoid';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { OperateTip } from '@/components/common/operate-tip';
import { getApis } from '@/constants/api';
import { useTranslate } from '@/hooks/use-translate';
import { BlacklistSource, BlacklistStatus } from '@/types/blacklist';
import { TipInfo, TipType } from '@/types/tip';
import { blacklistCollect } from '@/utils/blacklist-accrue';
import { getDefend } from '@/utils/defend';
import { getEnv } from '@/utils/setting';
import { getUserAccount } from '@/utils/user';

import './style.scss';

interface ReportInfo {
  url: string;
  address: string;
  reason: string;
}

export function Reporting() {
  const { t } = useTranslate();
  const navigate = useNavigate();

  const [tipControl, setTipControl] = useState<TipInfo>({
    isShow: false,
    type: TipType.SUCCESS,
    content: t('tip_submit.success'),
  });

  const [reportFormInfo, setReportFormInfo] = useState<ReportInfo>({
    url: '',
    address: '',
    reason: '',
  });

  useEffect(() => {
    getDefend()
      .then((defend) => {
        const isDefending = defend && defend.userStatus === undefined;
        isDefending &&
          setReportFormInfo((prev) =>
            cloneDeep({
              ...prev,
              url: defend?.url || '',
              address: defend?.contract || '',
            }),
          );
      })
      .catch((err) => console.error(err));
  }, []);

  const handleChangeFormInfo = useCallback((e: any) => {
    const { name, value } = e.target;
    setReportFormInfo((prev) => cloneDeep({ ...prev, [name]: value }));
  }, []);

  const handleReport = useCallback(async () => {
    if (tipControl.type === 'loading') {
      return;
    }

    const { url, reason, address } = reportFormInfo;

    if (!url) {
      return setTipControl({ isShow: true, type: TipType.ERROR, content: t('tip_url.not_fill') });
    }

    if (!reason) {
      return setTipControl({ isShow: true, type: TipType.ERROR, content: t('tip_reason.not_fill') });
    }

    if (url) {
      const urlRegExp = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\*\+,;=.]+$/;
      if (!urlRegExp.test(url)) {
        return setTipControl({ isShow: true, type: TipType.ERROR, content: t('tip_url.not_correct') });
      }
    }

    if (address && !ethers.utils.isAddress(address)) {
      return setTipControl({ isShow: true, type: TipType.ERROR, content: t('tip_contract.not_correct') });
    }

    setTipControl({ isShow: true, type: TipType.LOADING, content: t('tip_loading') });

    const from = await getUserAccount();
    const { address: userAddress = '', chainId = 1 } = from;
    let blacklistInfo: Record<string, any> = {
      source: BlacklistSource.REPORT,
      status: BlacklistStatus.PENDING,
      reason,
    };

    if (address) {
      blacklistInfo = {
        ...blacklistInfo,
        address,
        chainId,
        relatedWebsite: [url],
      };
    } else {
      blacklistInfo = {
        ...blacklistInfo,
        website: url,
      };
    }
    blacklistCollect(blacklistInfo as any);
    axios
      .post((await getApis(await getEnv())).SETTER_REPORT, {
        info: {
          ...reportFormInfo,
          id: nanoid(),
          from: userAddress,
          timestamp: new Date().getTime(),
        },
      })
      .then((res) => {
        const { code, msg } = res.data;
        if (code === 0 && msg === 'success') {
          setTipControl({ isShow: true, type: TipType.SUCCESS, content: t('tip_submit.success') });
          setTimeout(() => {
            navigate(-1);
          }, 1000);
        } else {
          setTipControl({ isShow: true, type: TipType.ERROR, content: t('tip_submit.error') });
        }
      })
      .catch((error) => {
        console.log(error);
        setTipControl({ isShow: true, type: TipType.ERROR, content: t('tip_submit.error') });
      });
  }, [navigate, reportFormInfo, t, tipControl.type]);

  const btnGroup = useMemo(
    () => (
      <div className="kekkai-btn-container">
        <div className="kekkai-btn kekkai-cancel-btn" onClick={() => navigate(-1)}>
          {t('report.btn_back')}
        </div>

        <div className="kekkai-btn kekkai-submit-btn" onClick={handleReport}>
          {t('report.btn_submit')}
        </div>
      </div>
    ),
    [handleReport, navigate, t],
  );

  return (
    <>
      <div style={{ fontSize: '18px', fontWeight: '700', color: '#2D2D2D', width: '100%', paddingTop: '24px' }}>
        {t('report.title')}
      </div>
      <div style={{ fontSize: '12px', color: '#2D2D2D', margin: '11px 0 0px', width: '100%' }}>
        {t('report.title_des')}
      </div>
      <div className="report-input-wrap">
        <div className="report-input-title report-input-title-url">{t('report.site_url')}</div>
        <input
          className="report-input-input"
          placeholder={t('report.site_url_placeholder')}
          name="url"
          onChange={handleChangeFormInfo}
          value={reportFormInfo.url || ''}
        />
      </div>
      <div className="report-input-wrap">
        <div className="report-input-title">{t('report.contract_or_wallet_add')}</div>
        <input
          className="report-input-input"
          placeholder={t('report.contract_or_wallet_add_placeholder')}
          name="address"
          onChange={handleChangeFormInfo}
          value={reportFormInfo.address || ''}
        />
      </div>
      <div className="report-input-wrap report-input-wrap">
        <div className="report-input-title">{t('report.details')}</div>
        <textarea
          className="report-input-input report-textarea"
          placeholder={t('report.details_placeholder')}
          name="reason"
          onChange={handleChangeFormInfo}
          value={reportFormInfo.reason || ''}
        />
      </div>
      <div style={{ width: '100%' }}>{btnGroup}</div>
      <OperateTip tipInfo={tipControl} />
    </>
  );
}
