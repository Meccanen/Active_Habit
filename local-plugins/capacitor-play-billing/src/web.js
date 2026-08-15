import { WebPlugin } from '@capacitor/core';

export class PlayBillingWeb extends WebPlugin {
  async queryProducts(_options) {
    console.warn('[PlayBilling] queryProducts: web ortamında satın alma desteklenmiyor, boş liste döndürülüyor.');
    return { products: [] };
  }

  async purchase(_options) {
    throw this.unimplemented('Play Billing sadece Android cihazlarda kullanılabilir.');
  }

  async isSupporter() {
    return { isSupporter: false };
  }

  async restorePurchases() {
    return { restored: false, isSupporter: false };
  }
}
