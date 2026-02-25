const eurFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

export function formatPrice(cents: number): string {
  return eurFormatter.format(cents / 100);
}
