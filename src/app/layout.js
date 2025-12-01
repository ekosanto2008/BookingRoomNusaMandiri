import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css"; // CSS Bootstrap
import "bootstrap-icons/font/bootstrap-icons.css"; // Icons
import "./globals.css";
// Import komponen yang barusan kita buat
import BootstrapClient from "@/components/BootstrapClient"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Portal Booking Ruangan",
  description: "Aplikasi pemesanan ruang meeting",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {/* Render halaman utama */}
        {children}
        
        {/* Panggil Script JS Bootstrap di sini */}
        <BootstrapClient />
      </body>
    </html>
  );
}