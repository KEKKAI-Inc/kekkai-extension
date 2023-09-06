interface StyleInterface {
  [propName: string]: React.CSSProperties;
}

const incorrectFeedbackStyle: StyleInterface = {
  incorrectFeedbackContainer: {
    padding: '23px 17px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '400px',
    height: '185.5px',
    margin: '0 auto',
    borderRadius: '20px',
    boxSizing: 'border-box',
    position: 'fixed',
    top: '10px',
    left: '-400px',
    zIndex: '99999',
    background: '#F5F5F5',
    boxShadow: '2px 2px 10px rgb(0,0,0,0.2)',
    transition: 'all 0.5s',
    fontFamily: 'TT_Norms_Pro',
  },
  correctSkip: {
    fontSize: '12px',
    lineHeight: '14px',
    textAlign: 'center',
    color: '#cacaca',
    cursor: 'pointer',
    marginTop: '12px',
  },
  correctDes: {
    width: '100%',
    fontSize: '17px',
    color: ' #363636',
    margin: '17px 0 23px 8px',
  },
  correctReasonDes: {
    marginBottom: '9px',
    paddingLeft: 0,
  },
  correctBtnContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    padding: '0 6px',
  },
  correctBtn: {
    width: '160px',
    height: '50px',
    border: '1px solid #555555',
    borderRadius: '8px',
    outline: 'none',
    lineHeight: '50px',
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: '19px',
    color: '#555555',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  correctReason: {
    width: '356px',
    height: '62px',
    background: '#333333',
    borderRadius: '5px',
    fontSize: '12.6px',
    color: '#fff',
    border: 'none',
    outline: 'none',
    resize: 'none',
    padding: '8px',
    margin: '0 8px',
  },
  correctThanks: {
    fontWeight: 700,
    fontSize: '18px',
    lineHeight: '22px',
    color: '#333333',
    padding: '58px 0',
  },
  correctSubmit: {
    height: '19px',
    position: 'absolute',
    right: '18px',
    bottom: '11px',
  },
  tipContainer: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '5.63px 8.76px 5.63px 5.63px',
    borderRadius: '7.6px',
    borderStyle: 'solid',
    borderWidth: '0.6px',
  },
  tipImg: {
    height: '21.27px',
    marginRight: '6.88px',
    display: 'block',
    marginTop: '2px',
  },
  tipDes: {
    fontSize: '12px',
    color: '#3F484D',
    margin: 0,
  },
  closeCorrect: {
    position: 'absolute',
    top: '23px',
    right: '17px',
    cursor: 'pointer',
    height: '20px',
    width: 'auto',
  },
};

export default incorrectFeedbackStyle;
