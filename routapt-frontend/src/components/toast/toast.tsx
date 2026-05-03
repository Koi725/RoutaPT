import { ToastProps } from "./toast-types";

export const Toast = ({ message }: ToastProps) => {
  if (!message) return null;
  return (
    <div className="toast">
      <span className="pip" />
      {message}
    </div>
  );
};