import copy from 'copy-to-clipboard';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Feedback } from '@/components/feedback';
import { TokenItem as TokenItemComponent } from '@/components/token-item';
import { Tooltip } from '@/components/tooltip';
import { CHAIN_INFO } from '@/constants/chain';
import { RISK_COLOR } from '@/constants/color';
import { IMAGE_PATH } from '@/constants/image-path';
import { useCertified } from '@/hooks/use-certified';
import { useContractOpenSource } from '@/hooks/use-contract-open-source';
import { useLargeValueGap } from '@/hooks/use-large-value-gap';
import { useLink } from '@/hooks/use-link';
import { useTranslate } from '@/hooks/use-translate';
import { BlacklistSource, BlacklistStatus, Scam } from '@/types/blacklist';
import { DefendParams } from '@/types/defend';
import { ERC20TokenInfo, NftTokenInfo, TokenType } from '@/types/eth';
import { Risk } from '@/types/risk';
import { Simulation } from '@/types/simulation';
import { GapSignal } from '@/types/valuation';
import { blacklistCollect } from '@/utils/blacklist-accrue';
import { setDefendUserStatus } from '@/utils/defend';
import { emitter } from '@/utils/emitter';
import { getEnsName, getTokenInfo } from '@/utils/eth';
import { collect } from '@/utils/mixpanel';
import { toFixed } from '@/utils/number';

import { useRisk } from './hooks/use-risk';
import { useSimulationBg } from './hooks/use-simulation-bg';
import { useSimulationValue } from './hooks/use-simulation-value';
import { getStyle } from './style';
import { checkIsNotSupportedChain, getDefaultTokenLogo } from './utils';
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
  callback,
}: DefendParams) {
  const { links } = useLink();
  const { t, language } = useTranslate();
  const gapSignal = useLargeValueGap({ simulation });
  const { inputBg, outputBg } = useSimulationBg(type);
  const { inputValue: simulationInputValue, outputValue: simulationOutputValue } = useSimulationValue(
    chainId,
    simulation,
  );
  const {
    isCertified,
    name: certifiedName,
    logo: certifiedLogo,
  } = useCertified({ origin, favIconUrl, contract: target, chainId });
  const { openSource } = useContractOpenSource({ contract: target, chainId });

  const skipTimer = useRef<NodeJS.Timer>();
  const tipTimer = useRef<NodeJS.Timer>();
  const hasLogSimulation = useRef<boolean>(false);

  const [countNum, setCountNum] = useState(-1);
  const [copyTip, setCopyTip] = useState<string>('');
  const [isFake, setIsFake] = useState<boolean>(false);
  const [isHoneypot, setIsHoneypot] = useState<boolean>(false);
  const [isTradeable, setIsTradeable] = useState<boolean>(true);
  const [targetEnsName, setTargetEnsName] = useState<string>();
  const [tokenInfo, setTokenInfo] = useState<NftTokenInfo | ERC20TokenInfo>();
  const [tokenImage, setTokenImage] = useState<string>(getDefaultTokenLogo());

  const { risk } = useRisk({
    chainId,
    type,
    origin,
    target,
    isHoneypot,
    simulation,
    isFake,
    gapSignal,
    isTradeable,
  });
  const style = useMemo(() => getStyle(risk), [risk]);
  const tokenType = useMemo(() => tokenInfo?.tokenType || _tokenType, [_tokenType, tokenInfo?.tokenType]);

  useEffect(() => {
    setCopyTip(t('copy.tip'));
  }, [t]);

  useEffect(() => {
    hasLogSimulation.current = false;
    collect('defend_show', {
      user,
      type,
      chainId: String(chainId),
      origin,
      contract,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  useEffect(() => {
    if (type !== 'transaction' || !simulation || hasLogSimulation.current) {
      return;
    }

    hasLogSimulation.current = true;
    collect('transaction_simulation', {
      user,
      origin,
      contract,
      chainId: String(chainId),
      status: simulation.status,
      msg: simulation.msg,
      show_duration: Date.now() - performance.timing.navigationStart,
    });
  }, [contract, origin, simulation, chainId, type, user]);

  useEffect(() => {
    if (type !== 'transaction' && contract) {
      getTokenInfo(contract, chainId, tokenId)
        .then((info) => setTokenInfo(info))
        .catch((err) => console.log(err));
    }
  }, [type, chainId, contract, tokenId]);

  const isNFT = useMemo(() => tokenType && [TokenType.ERC_1155, TokenType.ERC_721].includes(tokenType), [tokenType]);

  useEffect(() => {
    (async () => {
      // providerRef.current.lookupAddress(user).then((name: string | null) => {
      //   name && setUserEnsName(name);
      // });

      target &&
        getEnsName(target, chainId)?.then((name: string | null) => {
          name && setTargetEnsName(name);
        });
    })();
  }, [chainId, target, user]);

  useEffect(() => {
    const handler = ({ isHoneypot }: { isHoneypot: boolean }) => {
      isHoneypot && setIsHoneypot(isHoneypot);
    };
    emitter.on('token_is_honeypot', handler);
    return () => emitter.off('token_is_honeypot', handler);
  }, []);

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

  useEffect(() => {
    const handler = ({ isFake }: { isFake: boolean }) => {
      setIsFake(isFake);
    };
    const handlerDetectTradeable = ({ isTradeable }: { isTradeable: boolean }) => {
      setIsTradeable(isTradeable);
    };
    emitter.on('fake_token_detection', handler);
    emitter.on('tradeable_detection', handlerDetectTradeable);
    return () => {
      emitter.off('fake_token_detection', handler);
      emitter.off('tradeable_detection', handlerDetectTradeable);
    };
  }, []);

  useEffect(() => {
    return () => {
      skipTimer.current && clearInterval(skipTimer.current);
    };
  }, []);

  const tokenName = useMemo(() => tokenInfo?.symbol || tokenInfo?.name, [tokenInfo]);
  const contentBgSrc = useMemo(() => tokenInfo?.logo || IMAGE_PATH.LOGO_LARGE, [tokenInfo?.logo]);

  const handleApprovalContentClick = useCallback(() => {
    if (isNFT) {
      window.open(
        tokenId
          ? `https://opensea.io/assets/ethereum/${contract}/${tokenId}`
          : `https://etherscan.io/address/${contract}`,
      );
    }
  }, [contract, isNFT, tokenId]);

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

  const trackConfirmation = useCallback(
    (status: boolean) => {
      collect('defend_user_confirmation', {
        user,
        status,
        risk,
        type,
        origin,
        contract,
        chainId: String(chainId),
        isSimulationFinish: type === 'transaction' ? !!simulation : undefined,
        isHoneypot,
      });
    },
    [chainId, contract, origin, risk, simulation, type, user, isHoneypot],
  );

  const handleCancel = useCallback(() => {
    setDefendUserStatus(uuid, false, risk);
    trackConfirmation(false);
    skipTimer.current && clearInterval(skipTimer.current);
    callback && (location.href = callback + '?user_confirmation=false');
  }, [uuid, risk, trackConfirmation, callback]);

  const handleConfirm = useCallback(() => {
    setDefendUserStatus(uuid, true, risk);
    trackConfirmation(true);
    skipTimer.current && clearInterval(skipTimer.current);
    callback && (location.href = callback + '?user_confirmation=true');
  }, [uuid, risk, trackConfirmation, callback]);

  const renderRiskTip = useCallback(
    (text: JSX.Element | null) => {
      if (risk === Risk.NONE) {
        return null;
      }

      const isTextNull =
        !text ||
        (typeof text.props.children === 'string' && !text.props.children) ||
        (Array.isArray(text.props.children) && !text.props.children.some((i: any) => i));

      return (
        <div className="kekkai-risk-tip-container">
          <div className="kekkai-risk-tip-bar" style={{ background: RISK_COLOR[risk] }}>
            <img
              className="kekkai-risk-tip-bar-icon"
              src={risk === Risk.SAFE ? IMAGE_PATH.RISK_SAFE : IMAGE_PATH.RISK_WARNING}
              alt="risk-tip-logo"
            />
            <div>
              {risk === Risk.WARNING && t('defend.warning')}
              {risk === Risk.ALARM && t('defend.alarm')}
              {risk === Risk.SAFE && t('defend.safe')}
            </div>
          </div>

          {!isTextNull && (
            <div className="kekkai-risk-tip-text" style={{ color: risk !== Risk.SAFE ? RISK_COLOR[risk] : '#424242' }}>
              {text}
            </div>
          )}
        </div>
      );
    },
    [risk, t],
  );

  const transactionHappen = useMemo(
    () => (
      <div style={{ fontSize: '12px', color: '#A5A5A5', marginBottom: '-4px', marginTop: '10px', width: '100%' }}>
        {t('defend.transaction_happen')}
      </div>
    ),
    [t],
  );

  const renderScamTip = useCallback(
    (title: string, content: string, type = 'dangerous') => (
      <Tooltip
        content={
          <>
            <div
              style={{ fontSize: '16px', fontWeight: '700', lineHeight: '23px', color: '#202020', marginBottom: '5px' }}
            >
              {title}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '400', lineHeight: '17px', color: '#202020' }}>{content}</div>
          </>
        }
        light
      >
        {type === 'dangerous' ? (
          <img
            src={IMAGE_PATH.QUESTION_MARK_CIRCLE}
            alt="question"
            style={{ width: '19px', cursor: 'pointer', marginLeft: '4px' }}
          />
        ) : type === 'warning' ? (
          <img
            src={IMAGE_PATH.WARNING_GENERAL}
            alt="question"
            style={{ width: '14px', cursor: 'pointer', marginLeft: '3px' }}
          />
        ) : (
          <></>
        )}
      </Tooltip>
    ),
    [],
  );

  const renderSimulation = useCallback(
    (simulation: Simulation) => {
      const { status, gasCost, msg, output, input } = simulation;

      if (!status) {
        return (
          <>
            {transactionHappen}
            {renderRiskTip(
              <>
                <div>
                  <strong>
                    {t(
                      'defend.transaction_fail',
                      !gasCost
                        ? ''
                        : t(
                            'defend.transaction_fail_cost_gas',
                            toFixed(gasCost / 10 ** 18, 6) + CHAIN_INFO[chainId].currency,
                          ),
                    )}
                  </strong>
                </div>
                {msg && (
                  <>
                    <div style={{ marginTop: '20px' }}>
                      <strong>{t('defend.reason')}</strong>
                    </div>
                    <div style={{ marginTop: '8px' }}>{msg}</div>
                  </>
                )}
              </>,
            )}
          </>
        );
      }

      const hasInput = !!input?.length;
      const hasOutput = !!output?.length;

      return (
        <>
          {hasInput &&
            renderRiskTip(
              <>
                {isHoneypot && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <strong>{t('defend.honeypot_detected')}</strong>
                    {renderScamTip(t('defend.what_honeypot'), t('defend.what_honeypot_content'))}
                  </div>
                )}
                {isFake && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <strong>{t('defend.fake_token_title')}</strong>
                    {renderScamTip(t('defend.what_fake_token'), t('defend.what_fake_token_content'))}
                  </div>
                )}
                {!isTradeable && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>{t('defend.untradeable_content')}</div>
                )}
                {(gapSignal === GapSignal.RED || gapSignal === GapSignal.YELLOW) && (
                  // eslint-disable-next-line byted-internationalization/t-string
                  <strong>{t(`defend.large_value_${gapSignal}_tip`)}</strong>
                )}
              </>,
            )}

          {transactionHappen}

          {hasOutput && type !== 'upgrade_to' && (
            <div className="kekkai-content-container" key="output">
              {output.length < 5 && (
                <img className="kekkai-content-bg" src={outputBg || IMAGE_PATH.LOGO_LARGE} alt="" />
              )}
              {output?.map((item, index) => (
                <TokenItemComponent
                  key={(item.contract || '') + item.tokenId + index + item.tokenType}
                  {...item}
                  chainId={chainId}
                />
              ))}
            </div>
          )}

          {hasOutput && type === 'upgrade_to' && (
            <div className="kekkai-content-container-wrap">
              {output.map((item) => (
                <div className="kekkai-content-container" key={`${item.contract}:${item.tokenId}`}>
                  <img className="kekkai-content-bg" src={IMAGE_PATH.LOGO_LARGE} alt="" />
                  <TokenItemComponent {...item} chainId={chainId} />
                </div>
              ))}
            </div>
          )}

          {hasInput && (
            <div className="kekkai-content-container-wrap kekkai-content-container-wrap-transition">
              <div className="kekkai-content-container" key="input" style={{ marginTop: '0' }}>
                {input.length < 5 && (
                  <img className="kekkai-content-bg" src={inputBg || IMAGE_PATH.LOGO_LARGE} alt="" />
                )}
                {input?.map((item, index) => (
                  <TokenItemComponent
                    key={(item.contract || '') + item.tokenId + index + item.tokenType}
                    {...item}
                    chainId={chainId}
                  />
                ))}
              </div>
            </div>
          )}

          {!hasOutput && type === 'upgrade_to' && output && (
            <div className="kekkai-content-container" style={{ background: '#D9D9D9' }}>
              {t('defend.what_upgrade_to_no_asset_lost')}
            </div>
          )}

          {!hasOutput && !hasInput && type !== 'upgrade_to' && (
            <div className="kekkai-content-container" style={{ background: '#D9D9D9' }}>
              {t('defend.no_token_change')}
            </div>
          )}
        </>
      );
    },
    [
      renderRiskTip,
      isHoneypot,
      t,
      renderScamTip,
      isFake,
      gapSignal,
      transactionHappen,
      type,
      outputBg,
      inputBg,
      chainId,
      isTradeable,
    ],
  );

  const handleBlacklistAccrue = useCallback(async () => {
    if (risk !== Risk.NONE) {
      let scamType;
      let status = BlacklistStatus.CONFIRMED;
      if (type === 'sign') {
        if (!simulation) {
          scamType = Scam.ETH_SIGN;
        } else {
          const { output, input } = simulation;
          if (!isCertified && output?.length && !input?.length) {
            scamType = Scam.GASLESS_TRANSACTION;
          }
        }
      } else if (type === 'upgrade_to') {
        scamType = Scam.UPGRADE_TO;
        status = BlacklistStatus.PENDING;
      }

      if (scamType) {
        blacklistCollect({
          address: target,
          chainId,
          source: BlacklistSource.SYSTEM,
          status,
          scamType,
          relatedWebsite: origin ? [origin] : [],
          website: (scamType = Scam.ETH_SIGN ? origin : ''),
        });
      }
    }
  }, [chainId, isCertified, origin, risk, simulation, target, type]);

  const isNotSupportedChain = useMemo(() => checkIsNotSupportedChain(simulation), [simulation]);

  const hideConfirmBtn = useMemo(() => type === 'sign' && !simulation, [simulation, type]);

  useEffect(() => {
    if (isNotSupportedChain && !skipTimer.current && countNum < 0) {
      setCountNum(5);
      skipTimer.current = setInterval(() => setCountNum((prev) => prev - 1), 1000);

      return () => {
        if (skipTimer.current) {
          clearInterval(skipTimer.current);
          skipTimer.current = undefined;
          setCountNum(-1);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotSupportedChain]);

  useEffect(() => {
    if (countNum === 0) {
      handleConfirm();
    }
  }, [countNum, handleConfirm]);

  useEffect(() => {
    handleBlacklistAccrue();
  }, [handleBlacklistAccrue]);

  const targetBar = useMemo(() => {
    if (!target) {
      return null;
    }

    return (
      <div className="kekkai-target-container">
        <div className="kekkai-target-text" onClick={() => window.open(`https://etherscan.io/address/${target}`)}>
          {isCertified ? (
            <>
              {certifiedLogo && <img src={certifiedLogo} alt="" />}
              <span>{certifiedName}</span>
              <img src={IMAGE_PATH.CERTiFIED} alt="" />
            </>
          ) : (
            targetEnsName || target.slice(0, 10) + '...' + target.slice(-8)
          )}
          {!openSource &&
            renderScamTip(t('defend.not_open_source_title'), t('defend.not_open_source_content'), 'warning')}
        </div>

        <Tooltip content={copyTip} gapOffset={15}>
          <img
            className="kekkai-target-copy"
            src={IMAGE_PATH.COPY}
            alt="copy"
            onClick={handleTargetCopy}
            onMouseEnter={() => setCopyTip(t('copy.tip'))}
          />
        </Tooltip>
      </div>
    );
  }, [
    target,
    isCertified,
    certifiedLogo,
    certifiedName,
    targetEnsName,
    copyTip,
    handleTargetCopy,
    t,
    openSource,
    renderScamTip,
  ]);

  const txContent = useMemo(() => {
    if (type === 'approve') {
      return (
        <>
          {renderRiskTip(
            isNFT ? (
              tokenId ? (
                <div>{t('defend.approval_to', `${tokenName} #${tokenId}`)}</div>
              ) : (
                <div>{t('defend.approval_all_to', "'Set approval for all'")}</div>
              )
            ) : (
              <div>{t('defend.approval_to', String(tokenName))}</div>
            ),
          )}
          <div className="kekkai-content-container">
            <img className="kekkai-content-bg" src={contentBgSrc} alt="" />
            <div className="kekkai-content-title">
              <img className="kekkai-content-title-logo" src={tokenImage} alt="" />
              <div className="kekkai-content-title-text">
                {tokenName} {tokenInfo?.tokenType === TokenType.ERC_20 ? '' : tokenId ? '#' + tokenId : ''}
              </div>
            </div>
            <div className="kekkai-content-text">
              {t('defend.approval_tip_text_before')}
              <span className="kekkai-content-text-emphasize" onClick={handleApprovalContentClick}>
                {isNFT
                  ? tokenId
                    ? `${tokenName} ${tokenId && '#' + tokenId}`
                    : t('defend.approval_all_nft', tokenName || '')
                  : tokenName}
              </span>
              {t('defend.approval_tip_text_after')}
            </div>
          </div>
        </>
      );
    }

    if (type === 'sign') {
      if (!simulation) {
        return (
          <>
            {renderRiskTip(<strong>{t('defend.sign_now')}</strong>)}
            <div className="kekkai-content-container">
              <img className="kekkai-content-bg" src={IMAGE_PATH.SIGN_BG} alt="background" />
              <div className="kekkai-content-title">{t('defend.sign_tip_title')}</div>
              <div className="kekkai-content-text">{t('defend.sign_tip_content')}</div>
            </div>
          </>
        );
      }

      const seeMoreLink = links['gasless_transaction'];

      return (
        <>
          {!isCertified &&
            simulationInputValue < simulationOutputValue / 1.2 &&
            renderRiskTip(
              <>
                {t('defend.sign_facing')}
                <strong>{t('defend.sign_gasless_transaction')}</strong>
                {t('defend.sign_purchases_low')}
                {seeMoreLink && (
                  <span
                    style={{ textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={() => window.open(seeMoreLink)}
                  >
                    {t('defend.see_more')}
                  </span>
                )}
              </>,
            )}
          {renderSimulation(simulation)}
        </>
      );
    }

    if (type === 'transfer') {
      return (
        <>
          {transactionHappen}

          <div className="kekkai-content-container">
            <img className="kekkai-content-bg" src={contentBgSrc} alt="" />
            {tokenType && (
              <TokenItemComponent
                type={-1}
                tokenType={tokenType}
                contract={contract}
                tokenId={tokenType === TokenType.ERC_20 ? undefined : tokenId}
                amount={tokenType === TokenType.ERC_721 ? 1 : amount}
                chainId={chainId}
              />
            )}
          </div>

          {renderRiskTip(<strong>{t('defend.transfer_token_tip')}</strong>)}
        </>
      );
    }

    if (type === 'transaction') {
      if (!simulation) {
        return (
          <div className="kekkai-content-loading">
            <img src={IMAGE_PATH.LOADING} alt="loading" />
            <div className="kekkai-content-loading-text">{t('defend.transaction_loading')}</div>
          </div>
        );
      }

      if (isNotSupportedChain) {
        return (
          <div style={{ width: '100%' }}>
            <div style={{ color: '#A5A5A5', margin: '8px 0' }}>{t('defend.no_support_reasons')}</div>
            <div className="kekkai-content-black-box">{t('defend.no_support')}</div>
            <img src={IMAGE_PATH.ARIPLANE} alt="airplane" className="kekkai-content-airplane" />
            <div className="kekkai-content-des">
              {t('defend.you_can_feedback_01')}&nbsp;
              <a href={`https://kekkai.io/?language=${language}#feedback`} target="_blank" rel="noreferrer">
                <b style={{ textDecoration: 'underline' }}>{t('defend.you_can_feedback_02')}</b>
              </a>
              &nbsp;{t('defend.you_can_feedback_03')}
            </div>
          </div>
        );
      }

      const { gasCost, output, input } = simulation;
      const hasInput = !!input?.length;
      const hasOutput = !!output?.length;

      return (
        <>
          {renderSimulation(simulation)}

          {simulation.status && (
            <>
              {!hasInput && hasOutput && renderRiskTip(<strong>{t('defend.transfer_token_tip')}</strong>)}

              {typeof gasCost === 'number' && (
                <div
                  style={{ color: '#A5A5A5', width: '100%', textAlign: 'center', fontSize: '12px', marginTop: '8px' }}
                >
                  {t('defend.transaction_cost_gas', toFixed(gasCost / 10 ** 18, 6) + CHAIN_INFO[chainId].currency)}
                </div>
              )}
            </>
          )}
        </>
      );
    }

    if (type === 'upgrade_to') {
      if (!simulation) {
        return (
          <div className="kekkai-content-loading">
            <img src={IMAGE_PATH.LOADING} alt="loading" />
            <div className="kekkai-content-loading-text">{t('defend.transaction_loading')}</div>
          </div>
        );
      }

      return (
        <>
          {renderRiskTip(
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>{t('defend.upgrade_to_tip')}</strong>&nbsp;
              {renderScamTip(t('defend.what_is_this_scam'), t('defend.what_upgrade_to_content'))}
            </div>,
          )}

          {renderSimulation(simulation)}
        </>
      );
    }
  }, [
    type,
    renderRiskTip,
    isNFT,
    tokenId,
    t,
    tokenName,
    contentBgSrc,
    tokenImage,
    tokenInfo?.tokenType,
    handleApprovalContentClick,
    simulation,
    links,
    isCertified,
    simulationInputValue,
    simulationOutputValue,
    renderSimulation,
    transactionHappen,
    tokenType,
    contract,
    amount,
    chainId,
    isNotSupportedChain,
    language,
    renderScamTip,
  ]);

  const btnGroup = useMemo(() => {
    return (
      <div className="kekkai-btn-container">
        <div className="kekkai-btn kekkai-cancel-btn" onClick={handleCancel}>
          {t('defend.btn_reject')}
        </div>

        {!hideConfirmBtn && (
          <div className="kekkai-btn kekkai-confirm-btn" onClick={handleConfirm}>
            {countNum >= 0 ? t('correct_right.skip') + `(${countNum}s)` : t('defend.btn_proceed')}
          </div>
        )}
      </div>
    );
  }, [countNum, handleCancel, handleConfirm, hideConfirmBtn, t]);

  const feedback = useMemo(
    () => (
      <Feedback
        prefixText={
          risk === Risk.ALARM
            ? t('feedback.why_alarm')
            : isCertified
            ? t('feedback.why_verified')
            : t('feedback.got_problem')
        }
      />
    ),
    [isCertified, risk, t],
  );

  return (
    <>
      <style>{style}</style>

      <div className="kekkai-defend" onClick={(e) => e.stopPropagation()}>
        {targetBar}
        {txContent}
        {btnGroup}
      </div>

      {!isNotSupportedChain && feedback}
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
