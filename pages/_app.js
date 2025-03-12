import "@/styles/globals.css";
import { AuthProvider } from "../lib/authContext";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
