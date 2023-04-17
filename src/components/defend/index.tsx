import copy from 'copy-to-clipboard';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import mixpanel from 'mixpanel-browser';

import { Risk } from '../../types/risk';
import { ERC20TokenInfo, NftTokenInfo } from '../../types/eth';
import { DefendParams } from '../../types/defend';

import { emitter } from '../../utils/emitter';
import { toFixed } from '../../utils/number';
import { getEnsName, getTokenInfo } from '../../utils/eth';
import { setDefendUserStatus } from '../../utils/defend';

import { RISK_COLOR } from '../../constants/color';
import { IMAGE_PATH } from '../../constants/image-path';
import { TokenItem as TokenItemComponent } from '../../components/token-item';
import { useTranslate } from '../../hooks/use-translate';
import { useCertified } from '../../hooks/use-certified';

import { getStyle } from './style';
import { Tooltip } from '../tooltip';
import { Feedback } from '../feedback';
import { getDefaultTokenLogo } from './utils';

import './style.scss';


export default function Defend({
  user,
  type,
  origin,
  favIconUrl,
  contract,
  chainId = 1,
  tokenType: _tokenType,
  target,
  tokenId,
  amount,
  uuid,
  simulation,
}: DefendParams) {
  const { t } = useTranslate();
  const { isCertified, certifiedName } = useCertified({ origin, contract: target });
  const hasLogSimulation = useRef<boolean>(false);

  const [ _risk, setRisk ] = useState<Risk>(type === 'transaction' ? Risk.NONE : Risk.WARNING);
  const [ targetEnsName, setTargetEnsName ] = useState<string>();

  const [ tokenInfo, setTokenInfo ] = useState<NftTokenInfo | ERC20TokenInfo>();
  const [ tokenImage, setTokenImage ] = useState<string>(getDefaultTokenLogo());

  const [ copyTip, setCopyTip ] = useState<string>('');
  const [ inputBg, setInputBg ] = useState<string>();
  const [ outputBg, setOutputBg ] = useState<string>();

  if (!copyTip) {
    setCopyTip(t('copy.tip'));
  }

  const tipTimer = useRef<NodeJS.Timer>();

  const tokenType = useMemo(() => tokenInfo?.tokenType || _tokenType, [_tokenType, tokenInfo?.tokenType]);

  useEffect(() => {
    mixpanel.track('defend_show', {
      type,
      chainId,
      origin,
    });
  }, []);

  const risk = useMemo(() => {
    if (simulation?.honeypot?.length) {
      return Risk.WARNING;
    }

    if (simulation?.status === 0) {
      return Risk.ALARM;
    }

    if (type === 'sign') {
      return Risk.WARNING;
    }

    return isCertified ? Risk.SAFE : _risk;
  }, [simulation?.honeypot?.length, simulation?.status, type, isCertified, _risk]);

  useEffect(() => {
    contract && getTokenInfo(contract, chainId, tokenId).then(info => setTokenInfo(info));
  }, [chainId, contract, tokenId]);

  useEffect(() => {
    if (type === 'transaction') {
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
    }
  }, [inputBg, outputBg, type]);

  useEffect(() => {
    if (!simulation || hasLogSimulation.current) {
      return;
    }
    hasLogSimulation.current = true;
    mixpanel.track('transaction_simulation', {
      status: simulation.status,
      msg: simulation.msg,
      show_duration: Date.now() - performance.timing.navigationStart,
    });
  }, [simulation]);

  useEffect(() => {
    if (!simulation) {
      return;
    }

    const { status, input, output } = simulation;
    if (!status) {
      setRisk(Risk.ALARM);
    } else if (!input?.length && (output?.length)) {
      setRisk(Risk.WARNING);
    }
  }, [simulation]);

  useEffect(() => {
    (async () => {
      // providerRef.current.lookupAddress(user).then((name: string | null) => {
      //   name && setUserEnsName(name);
      // });
      
      target && getEnsName(target, chainId).then((name: string | null) => {
        name && setTargetEnsName(name);
      });
    })();
  }, [chainId, target, user]);

  useEffect(() => {
    let metadataLoaded = false;
    const logo = tokenInfo?.logo;
    if (logo) {
      const image = new Image();
      image.onload = () => {
        !metadataLoaded && setTokenImage(logo);
      };
      image.src = logo;
    }

    const metadataImage = (tokenInfo as NftTokenInfo)?.metadata?.image;
    if (metadataImage) {
      const image = new Image();
      image.onload = () => {
        metadataLoaded = true;
        setTokenImage(metadataImage);
      };
      image.src = metadataImage;
    }
  }, [tokenInfo]);

  const tokenName = useMemo(() => tokenInfo?.symbol, [tokenInfo]);
  const contentBgSrc = useMemo(() => tokenInfo?.logo || IMAGE_PATH.LOGO_LARGE, [tokenInfo?.logo]);

  const handleNftClick = useCallback(() => {
    if (tokenId) {
      window.open(`https://opensea.io/assets/ethereum/${contract}/${tokenId}`);
    } else {
      window.open(`https://etherscan.io/address/${contract}`)
    }
  }, [contract, tokenId]);

  const handleTargetCopy = useCallback(() => {
    if (target) {
      copy(target);
      setCopyTip(t('copy.success'));
      tipTimer.current && clearTimeout(tipTimer.current);
      tipTimer.current = setTimeout(() => {
        setCopyTip(t('copy.tip'));
      }, 3000);
    }
  }, [t, target]);

  const trackConfirmation = useCallback((status: boolean) => {
    mixpanel.track('defend_user_confirmation', {
      status,
      risk,
      origin,
      chainId,
    });
  }, [chainId, origin, risk]);

  const handleCancel = useCallback(() => {
    setDefendUserStatus(uuid, false);
    trackConfirmation(false);
  }, [uuid, trackConfirmation]);

  const handleConfirm = useCallback(() => {
    setDefendUserStatus(uuid, true);
    trackConfirmation(true);
  }, [uuid, trackConfirmation]);

  const renderRiskTip = useCallback((text: JSX.Element) => {
    if (risk === Risk.NONE) {
      return null;
    }

    return (
      <div className='kekkai-risk-tip-container'>
        <div className='kekkai-risk-tip-bar' style={{ background: RISK_COLOR[risk] }}>
          <img
            className='kekkai-risk-tip-bar-icon'
            src={risk === Risk.SAFE ? IMAGE_PATH.RISK_SAFE : IMAGE_PATH.RISK_WARNING}
            alt="risk-tip-logo"
          />
          <div>
            {risk === Risk.WARNING && t('defend.warning')}
            {risk === Risk.ALARM && t('defend.alarm')}
            {risk === Risk.SAFE && t('defend.safe')}
          </div>
        </div>
        
        <div className='kekkai-risk-tip-text' style={{ color: risk !== Risk.SAFE ? RISK_COLOR[risk] : '#424242' }}>
          {text}
        </div>
      </div>
    )
  }, [risk, t]);

  const style = useMemo(() => getStyle(risk), [risk]);

  const targetBar = useMemo(() => {
    if (!target) {
      return null;
    }

    return (
      <div className='kekkai-target-container'>
        <div
          className='kekkai-target-text'
          onClick={() => window.open(`https://etherscan.io/address/${target}`)}
        >
          {isCertified ? (
            <>
              {favIconUrl && <img src={favIconUrl} alt='' />}
              <span>{certifiedName}</span>
              <img src={IMAGE_PATH.CERTiFIED} alt='' />
            </>
          ): (targetEnsName || target)}
        </div>

        <Tooltip content={copyTip} gapOffset={15}>
          <img className='kekkai-target-copy' src={IMAGE_PATH.COPY} alt='copy' onClick={handleTargetCopy} />
        </Tooltip>
      </div>
    );
  }, [isCertified, certifiedName, copyTip, favIconUrl, handleTargetCopy, target, targetEnsName]);

  const txContent = useMemo(() => {
    if (type === 'approve') {
      return (
        <>
          {renderRiskTip((
            tokenId
              ? <div>{t('defend.approval_to', `${tokenName} #${tokenId}`)}</div>
              : <div>{t('defend.approval_all_to', "'Set approval for all'")}</div>
          ))}
          <div className='kekkai-content-container'>
            <img className='kekkai-content-bg' src={contentBgSrc} alt='' />
            <div className='kekkai-content-title'>
              <img
                className='kekkai-content-title-logo'
                src={tokenImage}
                alt=''
              />
              <div className='kekkai-content-title-text'>
                {tokenName} {tokenId && '#' + tokenId}
              </div>
            </div>
            <div className='kekkai-content-text'>
              {t('defend.approval_tip_text_before')}<span className='kekkai-content-text-emphasize' onClick={handleNftClick}>{tokenId ? `${tokenName} ${tokenId && '#' + tokenId}` : t('defend.approval_all_nft', tokenName || '')}</span>{t('defend.approval_tip_text_after')}
            </div>
          </div>
        </>
      );
    }

    if (type === 'sign') {
      return (
        <>
          {renderRiskTip(<strong>{t('defend.sign_now')}</strong>)}
          <div className='kekkai-content-container'>
            <img className='kekkai-content-bg' src={IMAGE_PATH.SIGN_BG} alt='background' />
            <div className='kekkai-content-title'>
              {t('defend.sign_tip_title')}
            </div>
            <div className='kekkai-content-text'>
              {t('defend.sign_tip_content')}
            </div>
          </div>
        </>
      );
    }

    const transactionHappen = (
      <div style={{ fontSize: '12px', color: '#A5A5A5', marginBottom: '-4px', marginTop: '10px', width: '100%' }}>
        {t('defend.transaction_happen')}
      </div>
    );

    if (type === 'transfer') {
      return (
        <>
          {transactionHappen}

          <div className='kekkai-content-container'>
            <img className='kekkai-content-bg' src={contentBgSrc} alt='' />
            {tokenType &&
              <TokenItemComponent
                type={-1}
                tokenType={tokenType}
                contract={contract!}
                tokenId={tokenId}
                amount={amount}
                chainId={chainId}
              />
            }
          </div>

          {renderRiskTip(<strong>{t('defend.transfer_token_tip')}</strong>)}
        </>
      );
    }

    if (type === 'transaction') {
      const isLoading = !simulation;

      if (isLoading) {
        return (
          <div className='kekkai-content-loading'>
            <img src={IMAGE_PATH.LOADING} alt='loading' />
            <div className='kekkai-content-loading-text'>{t('defend.transaction_loading')}</div>
          </div>
        );
      }

      const { status, gasCost, msg, output, input, honeypot } = simulation;

      if (!status) {
        return (
          <>
            {transactionHappen}
            {renderRiskTip((
              <>
              <div>
                <strong>{t('defend.transaction_fail', !gasCost ? '' : t('defend.transaction_fail_cost_gas', toFixed(gasCost / (10 ** 18), 6)))}</strong>
              </div>
              {msg && (
                <>
                  <div style={{ marginTop: '20px' }}>
                    <strong>{t('defend.reason')}</strong>
                  </div>
                  <div style={{ marginTop: '8px' }}>{msg}</div>
                </>
              )}
              </>
            ))}
          </>
        );
      }

      const hasInput = !!input?.length;
      const hasOutput = !!output?.length;

      return (
        <>
          {transactionHappen}

          {hasInput && !!honeypot?.length && renderRiskTip(
            <>
              <strong>{t('defend.honeypot_detected')}</strong>
              <Tooltip content={t('defend.what_honeypot_content')}>
                <span className='kekkai-content-honeypot'>{t('defend.what_honeypot')}</span>
              </Tooltip>
            </>
          )}

          {hasOutput && (
            <div className='kekkai-content-container' key='output'>
              <img className='kekkai-content-bg' src={outputBg || IMAGE_PATH.LOGO_LARGE} alt='' />
              {output?.map((item, index) => <TokenItemComponent key={(item.contract || '') + item.tokenId + index + item.tokenType} {...item}  chainId={chainId} />)}
            </div>
          )}

          {hasInput
            ? (
              <div className='kekkai-content-container' key='input'>
                <img className='kekkai-content-bg' src={inputBg || IMAGE_PATH.LOGO_LARGE} alt='' />
                {input?.map((item, index) => <TokenItemComponent key={(item.contract || '') + item.tokenId + index + item.tokenType} {...item} chainId={chainId} />)}
              </div>
            )
            : hasOutput
              ? renderRiskTip(<strong>{t('defend.transfer_token_tip')}</strong>)
              : <div className='kekkai-content-container' style={{ background: '#D9D9D9' }}>{t('defend.no_token_change')}</div>
          }

          {typeof gasCost === 'number' && (
            <div style={{ color: '#A5A5A5', width: '100%', textAlign: 'center', fontSize: '12px', marginTop: '8px' }}>
              {t('defend.transaction_cost_gas', toFixed(gasCost / (10 ** 18), 6))}
            </div>
          )}
        </>
      );
    }
  }, [type, t, renderRiskTip, tokenId, tokenName, contentBgSrc, tokenImage, handleNftClick, tokenType, contract, amount, chainId, simulation, outputBg, inputBg]);

  const btnGroup = useMemo(() => (
    <div className='kekkai-btn-container'>
      <div className='kekkai-btn kekkai-cancel-btn' onClick={handleCancel}>
        {t('defend.btn_reject')}
      </div>

      <div className='kekkai-btn kekkai-confirm-btn' onClick={handleConfirm}>
        {t('defend.btn_proceed')}
      </div>
    </div>
  ), [handleCancel, handleConfirm, t]);

  return (
    <>
      <style>
        {style}
      </style>

      <div className='kekkai-defend' onClick={(e) => e.stopPropagation()}>
        {targetBar}
        {txContent}
        {btnGroup}
      </div>

      <Feedback
        prefixText={risk === Risk.ALARM
          ? t('feedback.why_alarm')
          : isCertified
            ? t('feedback.why_verified')
            : t('feedback.got_problem')
        }
      />
    </>
  );
}

// import { base64ToArrayBuffer } from './utils';

// const touchIDOptions = {
//   publicKey: {
//     rp: { name: 'kekkai' },
//     user: {
//       id: '',
//       name: 'kekkai',
//       displayName: 'kekkai',
//     },
//     pubKeyCredParams: [
//       { type: 'public-key', alg: -7 },
//       { type: 'public-key', alg: -35 },
//       { type: 'public-key', alg: -36 },
//       { type: 'public-key', alg: -257 },
//       { type: 'public-key', alg: -258 },
//       { type: 'public-key', alg: -259 },
//       { type: 'public-key', alg: -37 },
//       { type: 'public-key', alg: -38 },
//       { type: 'public-key', alg: -39 },
//       { type: 'public-key', alg: -8 }
//     ],
//     challenge: '',
//     timeout: 60000,
//     authenticatorSelection: {
//       authenticatorAttachment: 'platform'
//     },
//   },
// };

// enum VerifyTouchIDStatus {
//   PENDING,
//   PROCESSING,
//   FAIL,
//   FINISH,
// }
// const [ verifyTouchIDStatus, setVerifyTouchIDStatus ] = useState<VerifyTouchIDStatus>(VerifyTouchIDStatus.PENDING);
// const verifyTouchID = useCallback(async () => {
//   const hasTouchID = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
//   if (hasTouchID) {
//     setVerifyTouchIDStatus(VerifyTouchIDStatus.PROCESSING)
//     return new Promise<void>(async (rs, rj) => {
//       touchIDOptions.publicKey.challenge = base64ToArrayBuffer('kekkai') as any;
//       touchIDOptions.publicKey.user.id = base64ToArrayBuffer('kekkai') as any;

//       try {
//         await navigator.credentials.create(touchIDOptions as unknown as CredentialCreationOptions);
//         setVerifyTouchIDStatus(VerifyTouchIDStatus.FINISH)
//         rs();
//       } catch (err) {
//         setVerifyTouchIDStatus(VerifyTouchIDStatus.FAIL)
//         rj(err);
//       }
//     });
//   }
// }, []);