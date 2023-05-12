export const onRpcRequest = async function () {
  const c = await ethereum.request({ method: 'eth_chainId' });
  return c;
};


//============================================================

import { text } from '@metamask/snaps-ui';

export const onRpcRequest = async function ({ origin }) {
  const c = await ethereum.request({ method: 'eth_chainId' });

  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: text('hello from ' + origin + '. You are on chain ' + c),
    },
  });
  return 'yay!';
};

//============================================================

import { text } from '@metamask/snaps-ui';
import pad from 'left-pad';

export const onRpcRequest = async function ({ origin }) {
  const c = await ethereum.request({ method: 'eth_chainId' });

  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: text('hello from ' + origin + '. You are on chain ' + c),
    },
  });
  return pad(c, 10, '0');
};

//============================================================

import { text } from '@metamask/snaps-ui';
import isEven from 'is-even';

export const onRpcRequest = async function ({ origin }) {
  const c = await ethereum.request({ method: 'eth_chainId' });

  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: text('hello from ' + origin + '. You are on chain ' + c),
    },
  });
  return 'even:' + isEven(parseInt(c));
};
