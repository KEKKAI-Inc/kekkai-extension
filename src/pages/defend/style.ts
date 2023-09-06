import { RISK_COLOR, RISK_COLOR_HOVER } from '../../constants/color';
import { Risk } from '../../types/risk';

export const getStyle = (risk: Risk) =>
`
.kekkai-content-text-emphasize {
  color: ${RISK_COLOR[risk]};
  text-decoration: underline;
  cursor: pointer;
}

.kekkai-confirm-btn {
  flex: 5;
  background: ${RISK_COLOR[risk]};
}

.kekkai-confirm-btn:hover {
  background: ${RISK_COLOR_HOVER[risk]};
}
`;