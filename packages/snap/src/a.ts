import { StaticModuleRecord } from '@endo/static-module-record';

const a = new StaticModuleRecord('export const aa=1;');

console.log(a);


export const onRpcRequest = (a) => { return 'yay'; };
export const onRpcRequest = (a) => { console.log(a); return 'yay'; };

import { text } from '@metamask/snaps-ui';

export const onRpcRequest = async ({ origin }) => {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation', content: text('hello ' + origin),
    },
  });
  return 'yay';
};