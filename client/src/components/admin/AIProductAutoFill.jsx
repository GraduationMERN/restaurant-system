import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { analyzeProductImage, clearAiProduct } from "../../redux/slices/aiProductSlice";
import { Sparkles } from "lucide-react";

export default function AIProductAutoFill({ categories, onApply, sourceFile }) {
  const dispatch = useDispatch();
  const { loading, lastResult, error } = useSelector((s) => s.aiProduct || {});
  const [localFile, setLocalFile] = useState(null);

  const pickFile = (e) => {
    const f = e.target.files?.[0] || null;
    setLocalFile(f);
  };

  const runAnalysis = async () => {
    const file = localFile || sourceFile;
    if (!file) return;
    await dispatch(clearAiProduct());
    const action = await dispatch(analyzeProductImage(file));
    const data = action.payload;
    if (!data) return;

    // Category auto-selection: match against both English and Arabic names
    const categoryName = String(data.categoryName || data.category || "").toLowerCase();
    let categoryId = "";
    if (categories && categories.length) {
      const match = categories.find((c) => {
        const en = String(c.name || "").toLowerCase();
        const ar = String(c.name_ar || "").toLowerCase();
        return (
          en === categoryName ||
          ar === categoryName ||
          en.includes(categoryName) ||
          categoryName.includes(en) ||
          (ar && (ar.includes(categoryName) || categoryName.includes(ar)))
        );
      });
      if (match) categoryId = match._id;
    }

    const tagsArr = Array.isArray(data.tags)
      ? data.tags
      : Array.isArray(data.ingredients)
      ? data.ingredients
      : [];
    const tags = tagsArr.join(", ");

    // Random fallback helpers (kept deterministic per call)
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomPoints = randInt(10, 500);
    const randomPointsToPay = randInt(5, 200);
    const randomStock = randInt(2, 20);

    // Apply AI suggestions to the form, with sensible fallbacks
    onApply({
      name: data.name || "",
      name_ar: data.name_ar || "",
      desc: data.desc || data.description || "",
      desc_ar: data.desc_ar || data.description_ar || "",
      basePrice: data.basePrice != null ? String(data.basePrice) : "",
      categoryId,
      tags,
      imgURL: data.imgURL || "",
      // Ensure isnew is true per requirement
      isnew: true,
      // Ensure stock is at least > 1
      stock: typeof data.stock === "number" && data.stock >= 2 ? data.stock : randomStock,
      // Random points if AI did not provide them
      productPoints:
        data.productPoints != null ? Number(data.productPoints) : randomPoints,
      pointsToPay:
        data.pointsToPay != null ? Number(data.pointsToPay) : randomPointsToPay,
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex items-center justify-between">
        {/* AI label with icon to indicate Gemini-like AI */}
        <div className="font-semibold flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1">
            <Sparkles className="w-4 h-4 text-white" />
          </span>
          <span>AI Auto-fill</span>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading || (!localFile && !sourceFile)}
          className="px-3 py-2 rounded bg-primary text-white disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Fill from Image"}
        </button>
      </div>
      <div className="mt-3">
        <input type="file" accept="image/*" onChange={pickFile} />
        <div className="text-xs text-gray-500 mt-1">
          You can select a file here or use the uploaded product image.
        </div>
        {(localFile || sourceFile) && (
          <div className="mt-1 text-sm text-gray-700">
            Choose file {(localFile || sourceFile)?.name || "selected"}
          </div>
        )}
      </div>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      {lastResult && (
        <div className="mt-3 text-sm text-gray-700">
          {/* Summary preview with bilingual fields */}
          Suggested: {lastResult.name} ({lastResult.name_ar || "AR"})
          · EGP {lastResult.basePrice}
          · {lastResult.categoryName || lastResult.category}
          · Points {lastResult.productPoints ?? "∼"}
          · PointsToPay {lastResult.pointsToPay ?? "∼"}
        </div>
      )}
    </div>
  );
}
