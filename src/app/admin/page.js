"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { getRooms, saveRooms, getBookings, saveBookings } from "@/utils/storage";

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeBookings, setActiveBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [detailData, setDetailData] = useState(null);
  const [roomForm, setRoomForm] = useState({ id: 0, name: "", cap: "", img: "", isMaintenance: false });
  const fileInputRef = useRef(null);

  // Load Data
  useEffect(() => {
    const checkLogin = () => {
        const isAdmin = sessionStorage.getItem('adminLoggedIn');
        if (isAdmin === 'true') { setIsLoggedIn(true); refreshData(); } 
        else {
            Swal.fire({ title: 'Login Admin', input: 'password', showCancelButton: false, confirmButtonText: 'Login', allowOutsideClick: false, preConfirm: (p) => p === 'admin123' ? true : Swal.showValidationMessage('Password Salah!') }).then((r) => {
                if (r.isConfirmed) { sessionStorage.setItem('adminLoggedIn', 'true'); setIsLoggedIn(true); refreshData(); }
            });
        }
    };
    if (typeof window !== 'undefined') checkLogin();
  }, []);

  const refreshData = () => {
    const allBookings = getBookings();
    setActiveBookings(allBookings.filter(b => b.status === 'Active'));
    setRooms(getRooms());
  };

  const handleLogout = () => {
    Swal.fire({ title: 'Logout?', icon: 'question', showCancelButton: true, confirmButtonText: 'Ya' }).then((r) => { 
        if (r.isConfirmed) { sessionStorage.removeItem('adminLoggedIn'); window.location.href = "/"; } 
    });
  };

  const clearAllData = () => {
    Swal.fire({ title: 'Reset Total?', text: 'Hapus semua data?', icon: 'warning', showCancelButton: true, confirmButtonText: 'RESET' }).then((r) => {
        if(r.isConfirmed) { localStorage.clear(); window.location.reload(); }
    });
  };

  const generateDummyData = () => {
    Swal.fire({ title: 'Generate Dummy?', text: 'Ini akan inject data random.', icon: 'question', showCancelButton: true, confirmButtonText: 'Gasss!' }).then((r) => {
      if (r.isConfirmed) {
        const divisions = ["IT", "HRD", "Finance", "Marketing", "Sales", "Direksi"];
        const names = ["Budi", "Siti", "Agus", "Dewi", "Rudi", "Nina"];
        const foods = ["Tanpa Konsumsi", "Snack Box", "Makan Siang", "Snack Box, Makan Siang", "Coffee Break"];
        const roomList = getRooms(); 
        const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const randomArr = (arr) => arr[Math.floor(Math.random() * arr.length)];
        
        let dummyBookings = [];
        const years = [2024, 2025];
        let idCounter = Date.now();

        years.forEach(year => {
            for (let month = 0; month < 12; month++) { 
                roomList.forEach(room => {
                    const meetingCount = randomInt(3, 5);
                    for (let k = 0; k < meetingCount; k++) {
                        const maxDate = new Date(year, month + 1, 0).getDate();
                        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${randomInt(1, maxDate).toString().padStart(2, '0')}`;
                        const startH = randomInt(8, 14);
                        dummyBookings.push({
                            id: idCounter++, roomId: room.id, roomName: room.name,
                            div: randomArr(divisions), pic: randomArr(names), pax: randomInt(5, 50),
                            food: randomArr(foods), date: dateStr,
                            startTime: `${startH}:00`, endTime: `${startH+1}:00`,
                            status: "Completed", createdBy: "System Dummy"
                        });
                    }
                });
            }
        });
        saveBookings(dummyBookings); refreshData(); Swal.fire('Sukses', `Inject ${dummyBookings.length} data!`, 'success');
      }
    });
  };

  const handleFinishMeeting = (id) => {
    Swal.fire({title:'Selesaikan?', showCancelButton:true, confirmButtonText:'Ya'}).then(r=>{
        if(r.isConfirmed){
            const all = getBookings();
            const idx = all.findIndex(x => x.id === id);
            if(idx !== -1){ all[idx].status = 'Completed'; saveBookings(all); refreshData(); Swal.fire('Sukses', 'Meeting selesai.', 'success'); }
        }
    });
  };

  // --- FITUR BARU: CANCEL BOOKING ---
  const handleCancelBooking = (id, pic) => {
    Swal.fire({
      title: 'Batalkan Booking?',
      text: `Yakin ingin menghapus pesanan dari ${pic}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus'
    }).then((r) => {
      if (r.isConfirmed) {
        const all = getBookings();
        const filtered = all.filter(x => x.id !== id);
        saveBookings(filtered);
        refreshData();
        Swal.fire('Terhapus', 'Booking telah dibatalkan.', 'success');
      }
    });
  };

  // ROOM CRUD
  const toggleMaintenance = (id) => {
    const newRooms = [...rooms];
    const idx = newRooms.findIndex(r => r.id === id);
    if (idx !== -1) { newRooms[idx].isMaintenance = !newRooms[idx].isMaintenance; saveRooms(newRooms); setRooms(newRooms); }
  };
  const deleteRoom = (id) => {
    Swal.fire({title:'Hapus Ruangan?', icon:'warning', showCancelButton:true, confirmButtonText:'Ya'}).then(r=>{
        if(r.isConfirmed){ const f = rooms.filter(x => x.id !== id); saveRooms(f); setRooms(f); }
    });
  };
  const openRoomModal = (room = null) => {
    if (room) setRoomForm(room);
    else { setRoomForm({ id: 0, name: "", cap: "", img: "", isMaintenance: false }); if(fileInputRef.current) fileInputRef.current.value = ""; }
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if(file.size > 1000000) { Swal.fire('Error', 'Max 1MB', 'error'); return; }
        const reader = new FileReader();
        reader.onloadend = () => setRoomForm(prev => ({ ...prev, img: reader.result }));
        reader.readAsDataURL(file);
    }
  };
  const handleRoomSubmit = (e) => {
    e.preventDefault();
    if (!roomForm.img) { Swal.fire('Error', 'Foto wajib', 'error'); return; }
    let newRooms = [...rooms];
    if (roomForm.id === 0) { const newId = newRooms.length > 0 ? Math.max(...newRooms.map(r => r.id)) + 1 : 1; newRooms.push({ ...roomForm, id: newId }); } 
    else { const idx = newRooms.findIndex(r => r.id === roomForm.id); if (idx !== -1) newRooms[idx] = roomForm; }
    saveRooms(newRooms); setRooms(newRooms);
    document.getElementById('closeRoomModalBtn').click(); Swal.fire('Berhasil', 'Tersimpan', 'success');
  };

  if (!isLoggedIn) return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="bg-light min-vh-100">
        <nav className="navbar navbar-expand-lg navbar-dark bg-danger sticky-top mb-4 shadow">
            <div className="container">
                <a className="navbar-brand fw-bold" href="#"><i className="bi bi-shield-lock"></i> Admin Panel</a>
                <div className="collapse navbar-collapse d-flex justify-content-between">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item"><a className="nav-link active fw-bold" href="#">Dashboard</a></li>
                        <li className="nav-item"><a className="nav-link" href="/admin/history">Laporan & Riwayat</a></li>
                    </ul>
                    <div className="d-flex gap-2">
                        <button className="btn btn-warning btn-sm" onClick={clearAllData}>Reset Data</button>
                        <button className="btn btn-info btn-sm text-white" onClick={generateDummyData}>+ Dummy</button>
                        <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </div>
        </nav>

        <div className="container pb-5">
            <div className="card shadow mb-4 border-primary">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Booking Aktif</h5>
                    <button className="btn btn-light btn-sm text-primary fw-bold" onClick={refreshData}><i className="bi bi-arrow-clockwise"></i> Refresh</button>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>No</th>
                                <th>Ruangan</th>
                                <th>PIC & Divisi</th>
                                <th>Akun Pembuat</th>
                                <th>Peserta</th>
                                <th>Waktu</th>
                                <th className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeBookings.length === 0 ? (<tr><td colSpan="7" className="text-center p-4 text-muted">Tidak ada booking aktif.</td></tr>) : (
                                activeBookings.map((b, index) => (
                                    <tr key={b.id}>
                                        <td>{index + 1}</td>
                                        <td className="fw-bold text-primary">{b.roomName}</td>
                                        <td><div className="fw-bold">{b.pic}</div><span className="badge bg-secondary">{b.div}</span></td>
                                        <td><small className="text-muted"><i className="bi bi-person"></i> {b.createdBy || 'Unknown'}</small></td>
                                        <td>{b.pax} Org</td>
                                        <td>{b.date}<br/><small>{b.startTime} - {b.endTime}</small></td>
                                        <td className="text-center">
                                            <div className="d-flex gap-1 justify-content-center">
                                                <button className="btn btn-sm btn-info text-white" data-bs-toggle="modal" data-bs-target="#detailModal" onClick={() => setDetailData(b)}><i className="bi bi-eye"></i></button> 
                                                <button className="btn btn-sm btn-danger" onClick={() => handleFinishMeeting(b.id)}><i className="bi bi-check-lg"></i></button>
                                                {/* TOMBOL BARU DISINI */}
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancelBooking(b.id, b.pic)} title="Cancel/Hapus"><i className="bi bi-trash"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* KELOLA RUANGAN */}
            <div className="card shadow mb-4 border-success">
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Kelola Ruangan</h5>
                    <button className="btn btn-light btn-sm text-success fw-bold" data-bs-toggle="modal" data-bs-target="#roomModal" onClick={() => openRoomModal(null)}><i className="bi bi-plus-circle"></i> Tambah</button>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped mb-0 align-middle">
                        <thead className="table-light"><tr><th>Foto</th><th>Nama</th><th>Kapasitas</th><th>Status</th><th className="text-center">Aksi</th></tr></thead>
                        <tbody>
                            {rooms.map((r) => (
                                <tr key={r.id}>
                                    <td><img src={r.img} className="rounded border" style={{width:'80px', height:'50px', objectFit:'cover'}} alt="Room" /></td>
                                    <td className="fw-bold">{r.name}</td>
                                    <td>{r.cap} Org</td>
                                    <td>{r.isMaintenance ? <span className="badge bg-danger">Renovasi</span> : <span className="badge bg-success">Aktif</span>}</td>
                                    <td className="text-center">
                                        <button className={`btn btn-sm me-1 ${r.isMaintenance ? 'btn-outline-success' : 'btn-outline-secondary'}`} onClick={() => toggleMaintenance(r.id)}><i className={`bi ${r.isMaintenance ? 'bi-check-lg' : 'bi-cone-striped'}`}></i></button>
                                        <button className="btn btn-sm btn-warning me-1" data-bs-toggle="modal" data-bs-target="#roomModal" onClick={() => openRoomModal(r)}><i className="bi bi-pencil"></i></button>
                                        <button className="btn btn-sm btn-danger" onClick={() => deleteRoom(r.id)}><i className="bi bi-trash"></i></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* MODAL DETAIL */}
        <div className="modal fade" id="detailModal" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header bg-info text-white"><h5 className="modal-title">Detail Booking</h5><button type="button" className="btn-close" data-bs-dismiss="modal"></button></div>
                    <div className="modal-body">
                        {detailData && (
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item"><strong>Ruangan:</strong> {detailData.roomName}</li>
                                <li className="list-group-item"><strong>Dibuat Oleh:</strong> {detailData.createdBy || '-'}</li>
                                <li className="list-group-item"><strong>Waktu:</strong> <span className="fw-bold text-primary">{detailData.date} | {detailData.startTime}-{detailData.endTime}</span></li>
                                <li className="list-group-item"><strong>PIC:</strong> {detailData.pic}</li>
                                <li className="list-group-item"><strong>Divisi:</strong> {detailData.div}</li>
                                <li className="list-group-item"><strong>Peserta:</strong> {detailData.pax} Orang</li>
                                <li className="list-group-item"><strong>Konsumsi:</strong> {detailData.food}</li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* MODAL ROOM FORM */}
        <div className="modal fade" id="roomModal" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header bg-success text-white"><h5 className="modal-title">{roomForm.id === 0 ? 'Tambah' : 'Edit'} Ruangan</h5><button type="button" className="btn-close" id="closeRoomModalBtn" data-bs-dismiss="modal"></button></div>
                    <div className="modal-body">
                        <form onSubmit={handleRoomSubmit}>
                            <div className="mb-3"><label>Nama</label><input type="text" className="form-control" required value={roomForm.name} onChange={(e) => setRoomForm({...roomForm, name: e.target.value})} /></div>
                            <div className="mb-3"><label>Kapasitas</label><input type="number" className="form-control" required value={roomForm.cap} onChange={(e) => setRoomForm({...roomForm, cap: e.target.value})} /></div>
                            <div className="mb-3"><label>Foto {roomForm.id === 0 && '(Wajib)'}</label><input type="file" className="form-control" accept="image/*" ref={fileInputRef} onChange={handleFileChange} required={roomForm.id === 0} /></div>
                            <button type="submit" className="btn btn-success w-100">Simpan</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}