import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRecommendationsForOrder,
  selectOrderRecommendations,
  selectOrderRecommendationsStatus,
  selectOrderRecommendationsError,
  clearOrderRecommendations,
} from "../../redux/slices/recommendationSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import api from "../../api/axios";

export default function OrderRecommendations() {
  const dispatch = useDispatch();
  const { products } = useSelector((s) => s.cart);
  const list = useSelector(selectOrderRecommendations);
  const status = useSelector(selectOrderRecommendationsStatus);
  const error = useSelector(selectOrderRecommendationsError);
  const [byId, setById] = useState({});
  const [addingIds, setAddingIds] = useState({});

  const signature = useMemo(
    () =>
      JSON.stringify(
        products.map((p) => ({
          id: p.productId?._id || p.productId,
          q: p.quantity,
          o: p.selectedOptions ? Object.values(p.selectedOptions).join("|") : "",
        }))
      ),
    [products]
  );

  useEffect(() => {
    if (products.length) {
      dispatch(clearOrderRecommendations());
      dispatch(fetchRecommendationsForOrder({ limit: 12 }));
    }
  }, [dispatch, signature, products.length]);

  useEffect(() => {
    const cartIds = new Set(products.map((p) => p.productId?._id || p.productId));
    const ids = (list || []).map((r) => r.productId).filter((id) => !!id && !cartIds.has(id));
    const missing = ids.filter((id) => !byId[id]);
    if (missing.length) {
      Promise.all(
        missing.map(async (id) => {
          try {
            const res = await api.get(`/api/products/${id}`);
            const p = res.data;
            setById((prev) => ({ ...prev, [id]: p }));
          } catch {}
        })
      );
    }
  }, [list, products]);

  const isOutOfStock = (p) => {
    if (!p?.options || p.options.length === 0) return (p?.stock ?? 0) <= 0;
    return p.options.every((o) => o.choices.every((c) => c.stock === 0));
  };

  const add = async (p) => {
    if (addingIds[p._id]) return;
    setAddingIds((prev) => ({ ...prev, [p._id]: true }));
    const opt = {};
    if (p.options && p.options.length) {
      p.options.forEach((o) => {
        const v = o.choices.find((c) => c.stock > 0)?.label || o.choices[0]?.label;
        if (v) opt[o.name] = v;
      });
    }
    try {
      await dispatch(
        addToCart({ productId: p._id, quantity: 1, selectedOptions: opt })
      ).unwrap();
    } catch {} finally {
      setAddingIds((prev) => {
        const next = { ...prev };
        delete next[p._id];
        return next;
      });
    }
  };

  const cartIdsSet = new Set(products.map((p) => p.productId?._id || p.productId));
  const filtered = (list || []).filter((r) => !cartIdsSet.has(r.productId)).slice(0, 5);

  return (
    <div>
      {status === "loading" && (
        <div className="py-2 text-center text-gray-600">Loading recommendations...</div>
      )}
      {status === "failed" && error && (
        <div className="py-2 text-center text-red-600">{error}</div>
      )}
      {status !== "loading" && !error && filtered.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {filtered.map((rec) => {
            const p = byId[rec.productId];
            if (!p) return null;
            const disabled = isOutOfStock(p) || !!addingIds[p._id];
            return (
              <div key={rec.productId} className="min-w-[180px] border rounded-xl p-2">
                {p.imgURL && (
                  <img
                    src={p.imgURL}
                    alt={p.name}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                )}
                <div className="text-sm font-semibold truncate">{p.name}</div>
                <div className="text-sm text-primary">EGP {p.basePrice}</div>
                <div className="text-xs text-gray-500 mt-1">{rec.reason}</div>
                <button
                  disabled={disabled}
                  onClick={() => add(p)}
                  className={`mt-2 w-full text-sm rounded-lg py-1.5 ${
                    disabled ? "bg-gray-300 text-gray-600" : "bg-primary text-white hover:bg-primary/90"
                  }`}
                >
                  {addingIds[p._id] ? "Adding..." : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
