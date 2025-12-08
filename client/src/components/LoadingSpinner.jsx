export default function LoadingSpinner({ size = "40px" }) {
  return (
    <div
      className="animate-spin border-4 border-primary border-t-transparent rounded-full"
      style={{ width: size, height: size }}
    ></div>
  );
}
