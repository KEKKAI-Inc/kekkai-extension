interface StyleInterface {
  [propName: string]: React.CSSProperties;
}

const operateTipStyle: StyleInterface = {
  tipContainer: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '5.63px 8.76px 5.63px 5.63px',
    borderRadius: '7.6px',
    borderStyle: 'solid',
    borderWidth: '0.6px',
    zIndex: 99,
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
};

export default operateTipStyle;
