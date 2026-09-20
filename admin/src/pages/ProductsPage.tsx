import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import { formatMoney } from '../lib/money';
import type { Category, Product } from '../lib/types';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  categoryId: '',
};

export function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function refresh() {
    const [nextCategories, nextProducts] = await Promise.all([
      api.listCategories(),
      api.listProducts(),
    ]);
    setCategories(nextCategories);
    setProducts(nextProducts);
    setForm((current) => ({
      ...current,
      categoryId: current.categoryId || nextCategories[0]?.id || '',
    }));
  }

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Error al cargar catálogo');
    });
  }, []);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.categoryId,
    });
    setImage(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id || '',
    });
    setImage(null);
  }

  async function onCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const created = await api.createCategory(categoryName);
      setCategoryName('');
      setCategories((current) => [...current, created]);
      setForm((current) => ({
        ...current,
        categoryId: current.categoryId || created.id,
      }));
    } catch (err) {
      setError(messageFrom(err));
    }
  }

  async function onSubmitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: form.categoryId,
      };
      const saved = editingId
        ? await api.updateProduct(editingId, payload)
        : await api.createProduct(payload);
      if (image) {
        await api.uploadProductImage(saved.id, image);
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('¿Eliminar este producto?')) {
      return;
    }
    setError(null);
    try {
      await api.deleteProduct(id);
      if (editingId === id) {
        resetForm();
      }
      await refresh();
    } catch (err) {
      setError(messageFrom(err));
    }
  }

  return (
    <div className="stack">
      <div>
        <p className="kicker">Catálogo</p>
        <h1>Productos</h1>
      </div>
      {error ? <p className="error">{error}</p> : null}

      <div className="grid-2">
        <div className="stack">
          <form className="card stack" onSubmit={onCreateCategory}>
            <h2>Nueva categoría</h2>
            <label>
              Nombre
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                required
              />
            </label>
            <button className="btn btn-ghost" type="submit">
              Crear categoría
            </button>
          </form>

          <form className="card stack" onSubmit={onSubmitProduct}>
            <h2>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
            <label>
              Nombre
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Descripción
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              Precio (PEN)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({ ...current, price: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) =>
                  setForm((current) => ({ ...current, stock: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Categoría
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                required
              >
                <option value="" disabled>
                  {categories.length ? 'Elige una' : 'Crea una categoría primero'}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Imagen
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              />
            </label>
            <div className="row">
              <button className="btn btn-primary" type="submit" disabled={pending}>
                {pending ? 'Guardando…' : editingId ? 'Actualizar' : 'Crear'}
              </button>
              {editingId ? (
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={resetForm}
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="card">
          {products.length === 0 ? (
            <p className="muted">Aún no hay productos.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      {product.images[0] ? (
                        <img
                          className="thumb"
                          src={product.images[0]}
                          alt=""
                        />
                      ) : (
                        <div className="thumb" />
                      )}
                    </td>
                    <td>
                      <strong>{product.name}</strong>
                      <div className="muted">{product.description}</div>
                    </td>
                    <td>{formatMoney(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-ghost"
                          type="button"
                          onClick={() => startEdit(product)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() => void onDelete(product.id)}
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function messageFrom(err: unknown) {
  return err instanceof ApiError || err instanceof Error
    ? err.message
    : 'Error inesperado';
}
