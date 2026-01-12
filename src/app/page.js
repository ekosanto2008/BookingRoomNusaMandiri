"use client";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getRooms, getBookings, saveBookings } from "@/utils/storage";

export default function BookingPortal() {
  const [view, setView] = useState("landing"); // 'landing' atau 'staff'
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [currentUser, setCurrentUser] = useState(""); 
  const [openScheduleId, setOpenScheduleId] = useState(null);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    div: "", pic: "", pax: "", food: [], date: "", startTime: "", endTime: ""
  });

  const foodOptions = ["Snack Box", "Makan Siang", "Coffee Break"];

  // --- USER DATA (LocalStorage) ---
  const getUsers = () => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('app_users');
    return data ? JSON.parse(data) : [];
  };

  const saveUser = (username, password) => {
    const users = getUsers();
    users.push({ username, password });
    localStorage.setItem('app_users', JSON.stringify(users));
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem('staffUser');
    if (storedUser) {
      setCurrentUser(storedUser);
      setView("staff");
      setRooms(getRooms());
      setBookings(getBookings());
    }
  }, []);

  // --- LOGIN LOGIC ---
  const handleStaffLogin = async () => {
    const { value: username } = await Swal.fire({
      title: 'Login Staff',
      input: 'text',
      inputLabel: 'Username',
      inputPlaceholder: 'Masukkan nama Anda...',
      allowOutsideClick: false,
      inputValidator: (v) => !v && 'Username tidak boleh kosong!'
    });

    if (!username) return;

    const users = getUsers();
    const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (existingUser) {
        const { value: pass } = await Swal.fire({
            title: `Halo, ${existingUser.username}`,
            input: 'password',
            inputLabel: 'Masukkan Password',
            allowOutsideClick: false
        });
        if (pass === existingUser.password) loginSuccess(existingUser.username);
        else Swal.fire('Gagal', 'Password salah!', 'error');
    } else {
        const { value: pass } = await Swal.fire({
            title: 'Pendaftar Baru',
            text: `Username "${username}" belum terdaftar. Buat password Anda:`,
            input: 'password',
            allowOutsideClick: false,
            inputValidator: (v) => !v && 'Password wajib dibuat!'
        });
        if (pass) {
            saveUser(username, pass);
            loginSuccess(username);
        }
    }
  };

  const loginSuccess = (name) => {
    sessionStorage.setItem('staffUser', name);
    setCurrentUser(name);
    setView("staff");
    setRooms(getRooms());
    setBookings(getBookings());
  };

  const handleLogout = () => {
    sessionStorage.removeItem('staffUser');
    window.location.reload();
  };

  // --- DASHBOARD FUNCTIONS ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const newB = {
      id: Date.now(), 
      roomId: selectedRoom.id, 
      roomName: selectedRoom.name,
      div: formData.div, pic: formData.pic, pax: formData.pax,
      food: formData.food.length > 0 ? formData.food.join(", ") : "Tanpa Konsumsi",
      date: formData.date, startTime: formData.startTime, endTime: formData.endTime,
      status: 'Active', createdBy: currentUser
    };
    const current = getBookings();
    current.push(newB);
    saveBookings(current);
    Swal.fire('Berhasil', 'Ruangan berhasil dipesan', 'success').then(() => window.location.reload());
  };

  // --- VIEW: LANDING (Sesuai Gambar image_76c253.png) ---
  if (view === "landing") {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-secondary bg-opacity-10">
        <h1 className="fw-bold mb-1">Portal Booking Ruangan</h1>
        <p className="text-muted mb-5">Universitas Nusa Mandiri</p>

        <div className="container">
          <div className="row justify-content-center g-4">
            {/* Kartu Login Staff */}
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0 py-5 text-center btn btn-light" onClick={handleStaffLogin} style={{borderRadius: '15px'}}>
                <div className="mb-3">
                  <i className="bi bi-person-badge-fill text-primary" style={{fontSize: '4rem'}}></i>
                </div>
                <h3 className="fw-bold">Login Staff</h3>
                <p className="text-muted px-4">Booking ruangan dan cek jadwal.</p>
              </div>
            </div>

            {/* Kartu Login Admin */}
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0 py-5 text-center btn btn-light" onClick={() => window.location.href='/admin'} style={{borderRadius: '15px'}}>
                <div className="mb-3">
                  <i className="bi bi-shield-lock text-danger" style={{fontSize: '4rem'}}></i>
                </div>
                <h3 className="fw-bold">Login Admin</h3>
                <p className="text-muted px-4">Kelola ruangan dan laporan.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: STAFF DASHBOARD ---
  return (
    <div className="bg-light min-vh-100 pb-5">
      <nav className="navbar navbar-dark bg-dark mb-4 sticky-top shadow">
        <div className="container">
          <span className="navbar-brand mb-0 h1"><i className="bi bi-building"></i> Portal Staff</span>
          <div className="d-flex align-items-center gap-3">
             <div className="text-white text-end" style={{lineHeight: '1'}}>
                <small className="text-white-50">User: </small><strong>{currentUser}</strong>
             </div>
             <button className="btn btn-danger btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row">
          {rooms.map((room) => (
            <div className="col-md-4 mb-4" key={room.id}>
              <div className={`card h-100 shadow-sm ${room.isMaintenance ? 'border-danger' : ''}`}>
                <div className="position-relative">
                    <img src={room.img} className="card-img-top" style={{ height: '200px', objectFit: 'cover' }} alt={room.name} />
                    {room.isMaintenance && <div className="position-absolute top-0 start-0 w-100 h-100 bg-white opacity-75 d-flex align-items-center justify-content-center fw-bold text-danger">RENOVASI</div>}
                </div>
                <div className="card-body">
                  <h5>{room.name}</h5>
                  <p className="small text-muted mb-3">Kapasitas: {room.cap} Orang</p>
                  
                  {!room.isMaintenance && (
                      <button className="btn btn-sm btn-outline-info w-100 mb-2" onClick={() => setOpenScheduleId(openScheduleId === room.id ? null : room.id)}>
                        {openScheduleId === room.id ? 'Tutup Jadwal' : 'Lihat Jadwal Terisi'}
                      </button>
                  )}

                  {openScheduleId === room.id && (
                    <div className="border rounded p-2 mb-2 bg-white small" style={{maxHeight: '120px', overflowY: 'auto'}}>
                        {bookings.filter(b => parseInt(b.roomId) === room.id && b.status === 'Active').map(b => (
                            <div key={b.id} className="d-flex justify-content-between border-bottom py-1">
                                <span>{b.startTime}-{b.endTime} <strong>{b.pic} ({b.div})</strong></span>
                                {b.createdBy === currentUser && <button onClick={() => {
                                    const up = bookings.filter(x => x.id !== b.id);
                                    setBookings(up); saveBookings(up);
                                }} className="btn btn-link text-danger p-0"><i className="bi bi-trash"></i></button>}
                            </div>
                        ))}
                    </div>
                  )}

                  <button className="btn btn-primary w-100" disabled={room.isMaintenance} data-bs-toggle="modal" data-bs-target="#bookingModal" onClick={() => {
                      setSelectedRoom(room);
                      setFormData({ div: "", pic: currentUser, pax: "", food: [], date: "", startTime: "", endTime: "" });
                  }}>Booking Sekarang</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL BOOKING */}
      <div className="modal fade" id="bookingModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white"><h5 className="modal-title">Form Booking</h5><button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
            <div className="modal-body">
              {selectedRoom && (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-2"><label className="small fw-bold">Ruangan</label><input type="text" className="form-control" value={selectedRoom.name} readOnly disabled /></div>
                    <div className="row g-2 mb-2">
                        <div className="col-6"><label className="small fw-bold">Divisi</label>
                            <select className="form-select" required value={formData.div} onChange={(e)=>setFormData({...formData, div: e.target.value})}>
                                <option value="">- Pilih -</option><option value="IT">IT</option><option value="HRD">HRD</option><option value="Finance">Finance</option><option value="Marketing">Marketing</option>
                            </select>
                        </div>
                        <div className="col-6"><label className="small fw-bold">Nama PIC</label><input type="text" className="form-control" required value={formData.pic} onChange={(e)=>setFormData({...formData, pic: e.target.value})} /></div>
                    </div>
                    <div className="mb-2"><label className="small fw-bold">Jumlah Peserta (Maks {selectedRoom.cap})</label><input type="number" className="form-control" max={selectedRoom.cap} required value={formData.pax} onChange={(e)=>setFormData({...formData, pax: e.target.value})} /></div>
                    <div className="mb-2">
                        <label className="small fw-bold">Konsumsi</label>
                        <div className="p-2 border rounded bg-light">
                            {foodOptions.map(f => (
                                <div key={f} className="form-check form-check-inline">
                                    <input className="form-check-input" type="checkbox" value={f} id={f} onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormData(prev => ({...prev, food: checked ? [...prev.food, f] : prev.food.filter(x => x !== f)}));
                                    }} />
                                    <label className="form-check-label small" htmlFor={f}>{f}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mb-2"><label className="small fw-bold">Tanggal</label><input type="date" className="form-control" required min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={(e)=>setFormData({...formData, date: e.target.value})} /></div>
                    <div className="row g-2 mb-3">
                        <div className="col-6"><label className="small fw-bold">Mulai</label><input type="time" className="form-control" required value={formData.startTime} onChange={(e)=>setFormData({...formData, startTime: e.target.value})} /></div>
                        <div className="col-6"><label className="small fw-bold">Selesai</label><input type="time" className="form-control" required value={formData.endTime} onChange={(e)=>setFormData({...formData, endTime: e.target.value})} /></div>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Konfirmasi Booking</button>
                  </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}