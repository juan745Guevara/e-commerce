/**
 * El carrito se modifica desde varios componentes independientes
 * (botón "agregar al carrito" en el producto, la vista del carrito, el
 * checkout al vaciarlo). Ninguno de ellos conoce al SiteHeader, que es
 * quien muestra el contador — así que en vez de acoplarlos, avisamos por
 * un evento del navegador y el header se refresca solo cuando lo escucha.
 */
export const CART_CHANGED_EVENT = "atelier:cart-changed";

export function notifyCartChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_CHANGED_EVENT));
  }
}
