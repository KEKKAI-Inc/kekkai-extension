import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';

import { useTranslate } from '../../hooks/use-translate';
import { useSetting } from '../../hooks/use-setting';
import { setSetting } from '../../utils/setting';
import { collect } from '../../utils/mixpanel';
import { getUserAccount } from '../../utils/user';
import { Allowlist, AllowlistType } from '../../types/setting';
import { TipInfo, TipType } from '../../types/tip';
import { IMAGE_PATH } from '../../constants/image-path';
import { OperateTip } from '../../components/common/operate-tip';

import './style.scss';

enum AllowlistModal {
  ADD = 'allowlist_add',
  DELETE_CONFIRM = 'allowlist_delete_confirm',
  NONE = 'none',
}

enum AllowlistSettingStatus {
  ADD = 'add',
  DELETE = 'delete',
  FILTER = 'filter',
  SEARCH = 'search',
}

const SINGLE_PAGE_MAX_COUNT = 6

const allowlistEmptyType = {
  SETTING_ALLOWLIST_EMPTY : 'allowlist.setting_allowlist_empty',
  CURRENT_ALLOWLIST_EMPTY : 'allowlist.current_allowlist_empty',
}

export function AllowlistSetting() {
  const { t } = useTranslate();
  const { setting } =  useSetting();

  const [addInputValue, setAddInputValue] = useState<string>();
  const [searchValue, setSearchValue] = useState<string>('');
  const [filterVal, setFilterVal] = useState<AllowlistType>();
  const [modal, setModal] = useState<AllowlistModal>(AllowlistModal.NONE);
  const [currentAllowlist, setCurrentAllowlist] = useState<Allowlist[]>([]);
  const [activeAllowlist, setActiveAllowlist] = useState<Allowlist>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showFilterSelect, setShowFilterSelect] = useState<boolean>(false);
  const [tipControl, setTipControl] = useState<TipInfo>({
    isShow: false,
    type: TipType.SUCCESS,
    content: t('tip_submit.success'),
  });
  const searchRef = useRef<any>();

  const getFrom = useCallback (async () => {
    const user = await getUserAccount();
    return user && user.address ? user.address : '';
  }, []);

  const maxPage = useMemo(() => {
    return Math.ceil(currentAllowlist.length / SINGLE_PAGE_MAX_COUNT);
  }, [currentAllowlist.length]);

  const handleAddAllowlist = useCallback(async() => {
    if (!addInputValue) {
      return setTipControl({
        isShow: true,
        type: TipType.ERROR,
        content: t('allowlist.url_or_address_empty'),
      });
    }

    if (setting.allowlist.some((allowlist) => allowlist.content === addInputValue)) {
      return setTipControl({
        isShow: true,
        type: TipType.ERROR,
        content: t('allowlist.url_or_address_exists'),
      });
    }

    let type: AllowlistType | undefined = undefined;
    if (ethers.utils.isAddress(addInputValue || '')) {
      type = AllowlistType.ADDRESS;
    } else {
      const urlRegExp=/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\*\+,;=.]+$/;
      if(urlRegExp.test(addInputValue)) {
        type = AllowlistType.WEBSITE;
      }
    }

    if(type) {
      setSetting({
        allowlist: [
          { 
            content: addInputValue, 
            type, 
            createTime: new Date().getTime(),
          },
          ...setting.allowlist,
        ],
      });
      setAddInputValue('');
      collect('allowlist_setting', {
        status : AllowlistSettingStatus.ADD,
        type,
        from: await getFrom(),
        content: addInputValue,
        allowlistLength: setting.allowlist.length + 1,
      });
      setTipControl({
        isShow: true,
        type: TipType.SUCCESS,
        content: t('allowlist.whitelist_added'),
      });
      setModal(AllowlistModal.NONE);
    } else {
      setTipControl({
        isShow: true,
        type: TipType.ERROR,
        content: t('allowlist.url_or_address_format_wrong'),
      });
    }
  }, [addInputValue, getFrom, setting.allowlist, t])

  const handleAddInputKeyDown = useCallback((e: any) => {
    if(e.keyCode !== 13) {
      return;
    }
    e.preventDefault();
    handleAddAllowlist();
  }, [handleAddAllowlist])

  const handleDelAllowlist = useCallback(async() => {
    if(!activeAllowlist) {
      return;
    }
    setSetting({
      allowlist: setting.allowlist?.filter((item) => {
        return item.content !== activeAllowlist.content;
      }),
    });
    setModal(AllowlistModal.NONE);
    setTipControl({
      isShow: true,
      type: TipType.SUCCESS,
      content: t('allowlist.whitelist_deleted'),
    });
    collect('allowlist_setting', {
      status : AllowlistSettingStatus.DELETE,
      type: activeAllowlist.type,
      from: await getFrom(),
      content: activeAllowlist.content,
      allowlistLength: setting.allowlist.length - 1 < 0 ? 0 : setting.allowlist.length - 1,
    });
  }, [activeAllowlist, getFrom, setting.allowlist, t]);

  const handleAddInputChange = useCallback((e: any) => {
    setAddInputValue(e.target.value)
  }, [])

  const handleSearchAllowlist = useCallback((async() => {
    setSearchValue(searchRef.current.value);
    collect('allowlist_setting', {
      status : AllowlistSettingStatus.SEARCH,
      from: await getFrom(),
      content: searchRef.current.value,
    });
  }), [getFrom])

  const handleSearchInputKeyDown = useCallback((e: any) => {
    if(e.keyCode !== 13) {
      return;
    }
    e.preventDefault();
    handleSearchAllowlist();
  }, [handleSearchAllowlist])

  const handleFilterAllowlist = useCallback(async(type: AllowlistType, e: any) => {
    e.stopPropagation();
    setShowFilterSelect(false);
    if(type === filterVal) {
      return setFilterVal(undefined);
    }
    setFilterVal(type);
    collect('allowlist_setting', {
      status : AllowlistSettingStatus.FILTER,
      from: await getFrom(),
      type,
    });
  }, [filterVal, getFrom])

  const handleChangeCurrentPage = useCallback((number: number) => {
    if(currentPage + number <= 1) {
      setCurrentPage(1);
    } else if(currentPage + number > maxPage) {
      setCurrentPage(maxPage);
    } else {
      setCurrentPage(prev => (prev + number));
    }
  },[currentPage, maxPage])

  const allowlistEmpty = useMemo(() => {
    return (
      <div className='kekkai-allowlist-empty'>
        <img src={IMAGE_PATH.ALLOWLIST_AIRPLANE} alt='' className='kekkai-allowlist-airplane'/>
        <p className='kekkai-allowlist-empty-content'>
          {setting.allowlist.length <= 0 ? t(allowlistEmptyType.SETTING_ALLOWLIST_EMPTY) : t(allowlistEmptyType.CURRENT_ALLOWLIST_EMPTY)}
        </p>
        <div className='kekkai-allowlist-add-btn-empty' onClick={() => setModal(AllowlistModal.ADD)}> 
          <img src={IMAGE_PATH.ALLOWLIST_ADD} alt='add' />
          <p>{t('allowlist.allowlist_add')}</p>
        </div>
      </div>
    )
  }, [setting.allowlist, t])
  
  const allowlistModalBody = useMemo(() => {
    if(modal === AllowlistModal.DELETE_CONFIRM) {
      return (
        <>
          <p className='kekkai-confirm-mask-label'>{t(`allowlist.${modal}_label`)}</p>
          <p
            style={{
              fontSize: '14px',
              color: '#F74B5E',
              textAlign: 'center',
              margin: '9px auto 10px',
              width: '80%',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {activeAllowlist?.content || ''}
          </p>
          <p style={{ fontSize: '14px', color: '#474747', lineHeight: '15px' }}>{t(`allowlist.${modal}_content`)}</p>
          <div className='kekkai-confirm-mask-button-wrap'>
            <div className='kekkai-confirm-mask-button kekkai-confirm-mask-button-cancel' onClick={() => {setModal(AllowlistModal.NONE)}}>
              {t('allowlist.allowlist_cancel')}
            </div>
            <div className='kekkai-confirm-mask-button' onClick={() => {handleDelAllowlist()}}>
              {t('allowlist.allowlist_delete')}
            </div>
          </div>
        </>
      )
    }

    if (modal === AllowlistModal.ADD) {
      return (
        <>
          <p className='kekkai-confirm-mask-label'>{t(`allowlist.${modal}_label`)}</p>
          <input
            type='text'
            className='kekkai-add-input'
            placeholder={t('allowlist.allowlist_add_input_placeholder')}
            onChange={handleAddInputChange}
            onKeyDown={handleAddInputKeyDown}
          />
          <p style={{ fontSize: '12px', color: '#474747', lineHeight: '15px' }}>{t(`allowlist.${modal}_content`)}</p>
          <div className='kekkai-confirm-mask-button-wrap'>
            <div className='kekkai-confirm-mask-button kekkai-confirm-mask-button-cancel' onClick={() => {setModal(AllowlistModal.NONE)}}>
              {t('allowlist.allowlist_cancel')}
            </div>
            <div className='kekkai-confirm-mask-button' onClick={handleAddAllowlist}>
              {t('allowlist.allowlist_add_btn')}
            </div>
          </div>
        </>
      )
    }

    return null;
  }, [modal, t, activeAllowlist?.content, handleDelAllowlist, handleAddInputChange, handleAddInputKeyDown, handleAddAllowlist])

  const allowlistTableBody = useMemo(() => {
    if(currentAllowlist.length <= 0) {
      return allowlistEmpty;
    }
    return currentAllowlist.slice(SINGLE_PAGE_MAX_COUNT * (currentPage - 1), SINGLE_PAGE_MAX_COUNT * currentPage).map((allowlist) => {
      return (
        <div className='kekkai-allowlist-table-tr' key={allowlist.content}>
          <p className='kekkai-allowlist-table-content'>{allowlist.content}</p>
          <p className='kekkai-allowlist-table-type'>{allowlist.type}</p>
          <p className='kekkai-allowlist-table-delete'>
            <img 
              style={{width: '12px'}}
              src={IMAGE_PATH.DELETE}
              alt={t('allowlist.allowlist_delete')}
              onClick={() => {setActiveAllowlist(allowlist); setModal(AllowlistModal.DELETE_CONFIRM)}}
            />
          </p>
        </div>
      )
    })
  }, [allowlistEmpty, currentAllowlist, currentPage, t])

  const header = useMemo(() => {
    return (
      <>
        <div className='kekkai-allowlist-label'>
          {t('allowlist.allowlist_setting')}
        </div>
        <div className='kekkai-allowlist-content'>
          {t('allowlist.allowlist_content')}
        </div>
      </>
    )
  },[t])

  const controller = useMemo(() => {
    return (
      <div className='kekkai-allowlist-add-wrap'>
        <div className='kekkai-allowlist-input-wrap'>
          <input 
            type='text' 
            className='kekkai-allowlist-input' 
            placeholder= {t('allowlist.allowlist_input_placeholder')} 
            ref={searchRef}
            onKeyDown={handleSearchInputKeyDown}
          />
          <img src={IMAGE_PATH.ALLOWLIST_SEARCH} alt='search' className='kekkai-allowlist-add-search-logo'/>
          <div className='kekkai-search' onClick={handleSearchAllowlist}>
            {t('allowlist.allowlist_search')}
          </div>
        </div>
        <div className='kekkai-allowlist-btn-wrap'>
          <div className='kekkai-allowlist-btn' onClick={() => {setModal(AllowlistModal.ADD)}}>
            <img src={IMAGE_PATH.ALLOWLIST_ADD} alt='add' />
          </div>
          <div className='kekkai-allowlist-btn kekkai-allowlist-add-dropdown' onClick={() => {setShowFilterSelect(prev => (!prev))}}>
            <img src={filterVal ? IMAGE_PATH.ALLOWLIST_DROPDOWN_GREEN : IMAGE_PATH.ALLOWLIST_DROPDOWN} alt='dropdown' />
            <div className='kekkai-allowlist-filter' style={{display: showFilterSelect ? 'block' : 'none'}} >
              {Object.keys(AllowlistType).map((key) => {
                return (
                  <p key={key} onClick={(e: any) => {handleFilterAllowlist((AllowlistType as any)[key], e)}}>
                    {t(`allowlist.allowlist_${key.toLowerCase()}`)}
                    <img 
                      src={IMAGE_PATH.ALLOWLIST_FILTER_SELECTED} 
                      alt='' 
                      style={{ width:'12px', display: filterVal === (AllowlistType as any)[key] ? 'block' : 'none' }}/>
                  </p>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }, [filterVal, handleSearchInputKeyDown, handleFilterAllowlist, handleSearchAllowlist, showFilterSelect, t])

  const body = useMemo(() => {
    return(
      <>
        <div className='kekkai-allowlist-table-label-wrap'>
          <p className='kekkai-allowlist-table-content'>{t('allowlist.allowlist_url_address')}</p>
          <p className='kekkai-allowlist-table-type'>{t('allowlist.allowlist_type')}</p>
        </div>
        <div className='kekkai-allowlist-table-tbody'>
          {allowlistTableBody}
        </div>
      </>
    )
  }, [t, allowlistTableBody])

  const footer = useMemo(() => {
    if(currentAllowlist.length > 0) {
      return (
        <div className='kekkai-allowlist-table-footer'>
          <div className='kekkai-allowlist-sorter'>
            <img src={IMAGE_PATH.ALLOWLIST_SORTER} alt=''  onClick={() => {handleChangeCurrentPage(-1)}}/>
            <p>{currentPage} / {maxPage || 0}</p>
            <img
              src={IMAGE_PATH.ALLOWLIST_SORTER}
              alt=''
              className='sorter-right'
              onClick={() => {handleChangeCurrentPage(1)}}
            />
          </div>
          <p className='kekkai-allowlist-total'>{t('allowlist.allowlist_total')} {currentAllowlist ? currentAllowlist.length : 0} {t('allowlist.allowlist_item')}</p>
        </div>
      );
    } else {
      return <div className='kekkai-allowlist-table-footer'/>;
    }
  }, [currentAllowlist, currentPage, handleChangeCurrentPage, maxPage, t])

  const dialog = useMemo(() => {
    return(
      <div className='kekkai-mask-layer' 
        style={{
          width: document.body.scrollWidth,
          height: document.body.scrollHeight,
          position: 'fixed',
          top: '0',
          left: '0',
          background: 'rgba(0,0,0,0.3)',
          zIndex: '1',
          display: modal === AllowlistModal.NONE ? 'none' : 'block'
        }}>
        <div className='kekkai-confirm-mask' style={{height: modal === AllowlistModal.ADD ? '204px' : '189px'}}>
          {allowlistModalBody}
        </div>
      </div>
    );
  },[allowlistModalBody, modal]);

  useEffect(() => {
    const afterFilterAllowlist = setting.allowlist?.filter((allowlist) => {
      return new RegExp(searchValue, 'i').test(allowlist.content);
    }).filter((allowlist) => {
      return filterVal ? allowlist.type === filterVal : true;
    });
    setCurrentAllowlist(afterFilterAllowlist);
  }, [filterVal, setting.allowlist, searchValue]);

  useEffect(() => {
    if(tipControl.isShow && tipControl.type !== TipType.ERROR){
      setTimeout(() => {
        setTipControl(prev => ({ ...prev, isShow: false }));
      }, 2000);
    }
    if(tipControl.type === TipType.ERROR && modal === AllowlistModal.NONE){
      setTipControl(prev => ({ ...prev, isShow: false }));
    }
  }, [modal, tipControl]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterVal, searchValue])

  return (
    <>
      {header}
      {controller}
      {body}
      {footer}
      {dialog} 
      {<OperateTip tipInfo={tipControl}/>}
    </>
  );
}
