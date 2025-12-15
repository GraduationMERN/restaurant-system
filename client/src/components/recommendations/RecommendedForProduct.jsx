import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRecommendationsByProduct,
  selectRecommendationsForProduct,
  selectRecommendationsStatus,
  selectRecommendationsError,
} from "../../redux/slices/recommendationSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import api from "../../api/axios";

export default function RecommendedForProduct({ productId }) {
  const dispatch = useDispatch();
  const list = useSelector((s) => selectRecommendationsForProduct(s, productId));
  const status = useSelector((s) => selectRecommendationsStatus(s, productId));
  const error = useSelector((s) => selectRecommendationsError(s, productId));
  const [byId, setById] = useState({});
  const [addingIds, setAddingIds] = useState({});

  useEffect(() => {
    if (productId) dispatch(fetchRecommendationsByProduct(productId));
  }, [dispatch, productId]);

  useEffect(() => {
    const ids = (list || []).map((r) => r.productId).filter((id) => !!id);
    const missing = ids.filter(
      (id) => !byId[id]
    );
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
  }, [list]);

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

  if (!productId) return null;

  return (
    <div className="mt-3">
      {status === "loading" && (
        <div className="py-2 text-center text-gray-600">Loading recommendations...</div>
      )}
      {status === "failed" && error && (
        <div className="py-2 text-center text-red-600">{error}</div>
      )}
      {status !== "loading" && !error && (list || []).length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {list.slice(0, 5).map((rec) => {
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
