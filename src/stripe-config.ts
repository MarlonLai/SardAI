export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: string;
  currency: string;
  interval?: 'month' | 'year';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_Sc40gUkhG84dOO',
    priceId: 'price_1RgpsmP3ZDp2xQGdHpezzWn0',
    name: 'SardAI Premium Mensile',
    description: 'Accesso completo alle funzionalità premium',
    mode: 'subscription',
    price: '5.00',
    currency: 'EUR',
    interval: 'month'
  },
  {
    id: 'prod_Sc42HX3us2RCWV',
    priceId: 'price_1Rgpu7P3ZDp2xQGdtuxS42fy',
    name: 'SardAI Premium Annuale',
    description: 'Piano annuale con risparmio del 17%',
    mode: 'subscription',
    price: '50.00',
    currency: 'CHF',
    interval: 'year'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};