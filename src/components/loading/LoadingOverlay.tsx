import { FC, PropsWithChildren } from "react";

interface LoadingOverlayProps {
  open?: boolean; // Controls whether the overlay is visible
  spinnerColor?: string; // Customize the spinner color
  overlayOpacity?: number; // Customize the overlay opacity
}

const LoadingOverlay: FC<PropsWithChildren<LoadingOverlayProps>> = ({
  open = false,
  spinnerColor = "#3b82f6", // Default to blue-500
  overlayOpacity = 0.7, // Default to 70% opacity
  children,
}) => {
  if (!open) return <>{children}</>;

  return (
    <div className="relative">
      {/* Overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur"
        style={{ opacity: overlayOpacity }}
        aria-live="polite"
        aria-busy="true"
      >
        {/* Spinner */}
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{ borderColor: spinnerColor }}
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>

      {/* Children */}
      {children}
    </div>
  );
};

export default LoadingOverlay;