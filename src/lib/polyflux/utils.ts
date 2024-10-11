import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

const fromGweiToMatic = (value: BigNumber | string | number): string => {
  if (!value) return '0';
  const bnValue = BigNumber.isBigNumber(value) ? value : new BigNumber(value);
  const maticValue = bnValue.dividedBy(new BigNumber(10).pow(9));
  return maticValue.toString();
};

const fromWeiToMatic = (value: BigNumber | string | number): string => {
  const bnValue = BigNumber.isBigNumber(value) ? value : new BigNumber(value);
  const maticValue = bnValue.dividedBy(new BigNumber(10).pow(18));
  return maticValue.toString();
};

export function fromMaticToWei(value: string | number): string {
  return ethers.parseUnits(value.toString(), 18).toString();
}
const convertToFullHex = (hex: string): string => {
  if (hex.length === 4) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return hex;
}

const roundToTwoSignificantFigures = (value: BigNumber | number): number => {
  const num = BigNumber.isBigNumber(value) ? value : new BigNumber(value);
  
  if (num.isZero()) {
    return 0;
  }
  
  const absNum = num.abs();
  let scale = new BigNumber(1);
  
  if (absNum.gte(100)) {
    while (absNum.div(scale).gte(100)) {
      scale = scale.times(10);
    }
  } else if (absNum.lt(1)) {
    while (absNum.div(scale).lt(10)) {
      scale = scale.div(10);
    }
  }
  
  return num.div(scale).decimalPlaces(1).times(scale).toNumber();
};

export { fromGweiToMatic, fromWeiToMatic, convertToFullHex, roundToTwoSignificantFigures }
