function getNextSmallVersion(version) {
  const versionArr = version.split('.').map(i => Number(i));
  versionArr[versionArr.length - 1]++;
  return versionArr.join('.');
}

function isNextVersion(current, compared) {
  const currentArr = current.split('.');
  const comparedArr = compared.split('.');
  const maxLength = Math.max(currentArr.length, comparedArr.length);

  for (let i = 0; i < maxLength; i++) {  
    const getNumber = (list) => {
      const str = list.length > i ? list[i] : 0;
      return isNaN(Number(str)) ? str.charCodeAt() : Number(str);
    };
    const currNumber = getNumber(currentArr);
    const comparedNumber = getNumber(comparedArr);

    if (currNumber < comparedNumber) {
      return false;
    } else if (currNumber > comparedNumber) {
      return true;
    }
  }
  return false;
}

module.exports = {
  getNextSmallVersion,
  isNextVersion,
};
