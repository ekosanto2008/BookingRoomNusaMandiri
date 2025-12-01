"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { getRooms, getBookings } from "@/utils/storage";

// Import CSS DataTables
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

export default function AdminHistory() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // --- STATE DATA ---
  const [rooms, setRooms] = useState([]);
  const [allBookings, setAllBookings] = useState([]); 
  const [filteredData, setFilteredData] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE FILTER ---
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  const tableRef = useRef(null);

  // 1. LOAD DATA AWAL
  useEffect(() => {
    const isAdmin = sessionStorage.getItem('adminLoggedIn');
    if (isAdmin !== 'true') {
        router.push('/admin');
        return;
    }
    setIsLoggedIn(true);

    const roomData = getRooms();
    const bookingData = getBookings()
        .filter(b => b.status === 'Completed')
        .reverse();

    setRooms(roomData);
    setAllBookings(bookingData);
    setFilteredData(bookingData); 
    setIsLoading(false);
  }, [router]);

  // 2. LOGIKA FILTER DATA
  useEffect(() => {
    let result = [...allBookings];
    if (filterRoom !== 'all') result = result.filter(b => parseInt(b.roomId) === parseInt(filterRoom));
    if (filterYear !== 'all') result = result.filter(b => b.date.startsWith(filterYear));
    if (filterMonth !== 'all') result = result.filter(b => b.date.split('-')[1] === filterMonth);
    setFilteredData(result);
  }, [filterRoom, filterMonth, filterYear, allBookings]);

  // 3. INISIALISASI DATATABLES (CARA AMAN: DATA INJECTION)
  useEffect(() => {
    if (!isLoading && tableRef.current) {
        const $ = require("jquery");
        const dt = require("datatables.net-bs5");

        // Hancurkan tabel lama jika ada
        if ($.fn.DataTable.isDataTable(tableRef.current)) {
            $(tableRef.current).DataTable().destroy();
        }

        // Kosongkan tbody
        $(tableRef.current).find('tbody').empty();

        // Init DataTable
        $(tableRef.current).DataTable({
            data: filteredData,
            responsive: true,
            pageLength: 20, // <--- INI SETTING AGAR DEFAULT 20 PER HALAMAN
            lengthMenu: [[10, 20, 50, 100, -1], [10, 20, 50, 100, "Semua"]], // Opsi dropdown pilihan
            columns: [
                { 
                    title: "No", 
                    data: null, 
                    render: (data, type, row, meta) => meta.row + 1,
                    className: "text-center"
                },
                { title: "Tanggal", data: "date" },
                { 
                    title: "Jam", 
                    data: null, 
                    render: (data, type, row) => `${row.startTime} - ${row.endTime}` 
                },
                { title: "Ruangan", data: "roomName" },
                { 
                    title: "Divisi & PIC", 
                    data: null, 
                    render: (data, type, row) => `
                        <span class="badge bg-primary mb-1">${row.div}</span><br/>
                        <small class="fw-bold">${row.pic}</small>
                    `
                },
                { title: "Pax", data: "pax", className: "text-center" },
                { 
                    title: "Konsumsi", 
                    data: "food",
                    render: (data) => data || '-' 
                },
                { 
                    title: "Status", 
                    data: null,
                    render: () => '<span class="badge bg-success">Selesai</span>',
                    className: "text-center"
                }
            ],
            language: {
                search: "Cari:",
                lengthMenu: "Tampil _MENU_",
                info: "Hal _PAGE_ dari _PAGES_",
                infoEmpty: "Kosong",
                infoFiltered: "(total _MAX_)",
                paginate: { first: "<<", last: ">>", next: ">", previous: "<" },
                zeroRecords: "Data tidak ditemukan"
            }
        });
    }
  }, [filteredData, isLoading]); 

  // 4. PRINT PDF
  const printPDF = () => {
    if (filteredData.length === 0) { Swal.fire('Info', 'Tidak ada data.', 'info'); return; }

    const monthName = filterMonth === 'all' ? 'Semua Bulan' : document.querySelector(`#filterMonth option[value="${filterMonth}"]`).text;
    const roomName = filterRoom === 'all' ? 'Semua Ruangan' : rooms.find(r=>r.id==filterRoom)?.name;
    const titleInfo = `${roomName} - ${monthName} ${filterYear === 'all' ? '' : filterYear}`;

    const win = window.open('', '', 'height=800,width=1000');
    let rows = '';
    filteredData.forEach((b, i) => {
        rows += `<tr>
            <td style="text-align:center">${i+1}</td>
            <td>${b.date}</td>
            <td>${b.startTime}-${b.endTime}</td>
            <td>${b.roomName}</td>
            <td>${b.div}<br><small>${b.pic}</small></td>
            <td style="text-align:center">${b.pax}</td>
            <td>${b.food || '-'}</td>
        </tr>`;
    });

    win.document.write(`
        <html><head><title>Cetak Laporan</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>@page{size:A4;margin:10mm} body{font-family:sans-serif;margin:20px} .table{font-size:12px}</style>
        </head><body onload="window.print();window.close();">
        <h4 class="text-center fw-bold mb-0">LAPORAN PENGGUNAAN RUANG MEETING</h4>
        <p class="text-center text-muted mb-4">${titleInfo}</p>
        <table class="table table-bordered table-sm table-striped">
        <thead class="table-dark"><tr><th>No</th><th>Tanggal</th><th>Jam</th><th>Ruangan</th><th>Divisi/PIC</th><th>Pax</th><th>Konsumsi</th></tr></thead>
        <tbody>${rows}</tbody></table>
        <div class="text-end mt-5"><p>Mengetahui,<br><br><br>____________________<br>Admin GA</p></div>
        </body></html>
    `);
    win.document.close();
  };

  if (!isLoggedIn) return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="bg-light min-vh-100">
        <nav className="navbar navbar-expand-lg navbar-dark bg-danger sticky-top mb-4 shadow">
            <div className="container">
                <a className="navbar-brand fw-bold" href="/admin"><i className="bi bi-shield-lock"></i> Admin Panel</a>
                <div className="collapse navbar-collapse d-flex justify-content-between">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item"><a className="nav-link" href="/admin">Dashboard</a></li>
                        <li className="nav-item"><a className="nav-link active fw-bold" href="#">Laporan & Riwayat</a></li>
                    </ul>
                    <button className="btn btn-outline-light btn-sm" onClick={() => {sessionStorage.removeItem('adminLoggedIn'); router.push('/');}}>Logout</button>
                </div>
            </div>
        </nav>

        <div className="container pb-5">
            <div className="card shadow">
                <div className="card-header bg-secondary text-white">
                    <h5 className="mb-0"><i className="bi bi-file-earmark-bar-graph"></i> Laporan & Filter</h5>
                </div>
                
                <div className="card-body bg-light border-bottom">
                    <div className="row g-2 align-items-end">
                        <div className="col-md-3">
                            <label className="small fw-bold">Ruangan</label>
                            <select className="form-select form-select-sm" value={filterRoom} onChange={(e)=>setFilterRoom(e.target.value)}>
                                <option value="all">Semua Ruangan</option>
                                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="small fw-bold">Bulan</label>
                            <select id="filterMonth" className="form-select form-select-sm" value={filterMonth} onChange={(e)=>setFilterMonth(e.target.value)}>
                                <option value="all">Semua Bulan</option>
                                <option value="01">Januari</option><option value="02">Februari</option><option value="03">Maret</option>
                                <option value="04">April</option><option value="05">Mei</option><option value="06">Juni</option>
                                <option value="07">Juli</option><option value="08">Agustus</option><option value="09">September</option><option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="small fw-bold">Tahun</label>
                            <select className="form-select form-select-sm" value={filterYear} onChange={(e)=>setFilterYear(e.target.value)}>
                                <option value="all">Semua Tahun</option>
                                <option value="2024">2024</option><option value="2025">2025</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <button className="btn btn-outline-primary btn-sm w-100" onClick={printPDF}>
                                <i className="bi bi-printer"></i> Cetak PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-3 py-2 bg-white border-bottom">
                    <small className="text-muted fw-bold">Total Data: <span className="text-primary">{filteredData.length}</span> Transaksi</small>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive p-3">
                        <table ref={tableRef} className="table table-striped table-bordered w-100" style={{width:"100%"}}>
                            {/* Kosongkan konten, DataTables yang isi */}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}