export default function LoadingSpinner({ size = "40px", fullScreen = false }) {
  const spinner = (
    <div
      className="animate-spin border-4 border-primary border-t-transparent rounded-full"
      style={{ width: size, height: size }}
    ></div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center w-screen h-screen bg-white z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}