"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function LandingPage() {
  const router = useRouter();

  // Cek jika user sudah login, langsung arahkan ke halamannya
  useEffect(() => {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        router.push('/admin');
    } else if (sessionStorage.getItem('staffLoggedIn') === 'true') {
        router.push('/staff');
    }
  }, [router]);

  const handleLogin = (role) => {
    if (role === 'admin') {
        // Login Admin
        Swal.fire({
            title: 'Login Admin',
            input: 'password',
            icon: 'lock',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Masuk Admin',
            preConfirm: (pass) => pass === 'admin123' ? true : Swal.showValidationMessage('Password Salah!')
        }).then((result) => {
            if (result.isConfirmed) {
                sessionStorage.setItem('adminLoggedIn', 'true');
                router.push('/admin');
            }
        });
    } else {
        // Login Staff
        Swal.fire({
            title: 'Login Staff',
            input: 'password',
            icon: 'person',
            showCancelButton: true,
            confirmButtonColor: '#0d6efd',
            confirmButtonText: 'Masuk Staff',
            preConfirm: (pass) => pass === 'staff123' ? true : Swal.showValidationMessage('Password Salah!')
        }).then((result) => {
            if (result.isConfirmed) {
                sessionStorage.setItem('staffLoggedIn', 'true');
                router.push('/staff');
            }
        });
    }
  };

  return (
    <div className="d-flex min-vh-100 align-items-center justify-content-center bg-light">
        <div className="container text-center">
            <h1 className="mb-4 fw-bold">Portal Booking Ruangan</h1>
            <p className="text-muted mb-5">Universitas Nusa Mandiri</p>

            <div className="row justify-content-center g-4">
                {/* TOMBOL USER / STAFF */}
                <div className="col-md-5">
                    <div className="card shadow-sm h-100 p-4 btn btn-outline-primary border-0" onClick={() => handleLogin('staff')} style={{cursor:'pointer'}}>
                        <i className="bi bi-person-workspace display-4 mb-3 text-primary"></i>
                        <h3>Login Staff</h3>
                        <p className="small text-muted">Booking ruangan dan cek jadwal.</p>
                    </div>
                </div>

                {/* TOMBOL ADMIN */}
                <div className="col-md-5">
                    <div className="card shadow-sm h-100 p-4 btn btn-outline-danger border-0" onClick={() => handleLogin('admin')} style={{cursor:'pointer'}}>
                        <i className="bi bi-shield-lock display-4 mb-3 text-danger"></i>
                        <h3>Login Admin</h3>
                        <p className="small text-muted">Kelola ruangan dan laporan.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}