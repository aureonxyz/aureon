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

const roundToTwoSignificantFigures = (num: number): number => {
  if (num === 0) {
    return 0;
  }
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  const scale = Math.pow(10, magnitude - 1);
  return parseFloat((Math.round(num / scale) * scale).toPrecision(2));
}

export { fromGweiToMatic, fromWeiToMatic, convertToFullHex, roundToTwoSignificantFigures }
