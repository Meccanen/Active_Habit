import { registerPlugin } from '@capacitor/core';

const PlayBilling = registerPlugin('PlayBilling', {
  web: () => import('./web.js').then((m) => new m.PlayBillingWeb()),
});

export default PlayBilling;
