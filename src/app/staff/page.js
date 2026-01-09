"use client";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getRooms, getBookings, saveBookings } from "@/utils/storage";

export default function StaffPortal() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]); // Data semua booking
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openScheduleId, setOpenScheduleId] = useState(null); // ID ruangan yang jadwalnya dibuka
  
  // State untuk Modal & Form
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    div: "", pic: "", pax: "", food: "Tanpa Konsumsi", date: "", startTime: "", endTime: ""
  });

  // --- 1. LOAD DATA ---
  useEffect(() => {
    const loginStatus = sessionStorage.getItem('staffLoggedIn');
    if (loginStatus === 'true') {
      setIsLoggedIn(true);
      setRooms(getRooms());
      setBookings(getBookings()); // Load booking juga
    } else {
      Swal.fire({
        title: 'Login Staff', input: 'password', showCancelButton: false, confirmButtonText: 'Masuk', allowOutsideClick: false,
        preConfirm: (p) => p === 'staff123' ? true : Swal.showValidationMessage('Password Salah!')
      }).then((r) => {
        if (r.isConfirmed) {
          sessionStorage.setItem('staffLoggedIn', 'true');
          setIsLoggedIn(true);
          setRooms(getRooms());
          setBookings(getBookings());
        }
      });
    }
  }, []);

  // --- 2. HANDLERS ---
  const handleLogout = () => {
    Swal.fire({ title: 'Logout?', icon: 'question', showCancelButton: true, confirmButtonText: 'Ya' }).then((r) => {
      if (r.isConfirmed) { sessionStorage.removeItem('staffLoggedIn'); window.location.href = "/"; }
    });
  };

  const toggleSchedule = (roomId) => {
    // Jika diklik ulang, tutup. Jika beda, buka yang baru.
    if (openScheduleId === roomId) {
        setOpenScheduleId(null);
    } else {
        setOpenScheduleId(roomId);
    }
  };

  const openBookingModal = (room) => {
    if (room.isMaintenance) { Swal.fire('Maaf', 'Ruangan sedang dalam renovasi.', 'error'); return; }
    setSelectedRoom(room);
    setFormData({ div: "", pic: "", pax: "", food: "Tanpa Konsumsi", date: "", startTime: "", endTime: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const roomId = selectedRoom.id;
    const pax = parseInt(formData.pax);
    const cap = parseInt(selectedRoom.cap);
    const { date, startTime, endTime } = formData;

    if (pax > cap) { Swal.fire('Kapasitas Berlebih', `Maksimal ${cap} orang.`, 'warning'); return; }
    if (endTime <= startTime) { Swal.fire('Jam Error', 'Jam Selesai harus lebih akhir!', 'error'); return; }

    const now = new Date();
    if (new Date(`${date}T${startTime}`) < now) { Swal.fire({ icon: 'error', title: 'Waktu Sudah Lewat!', text: 'Tidak bisa pesan waktu lampau.' }); return; }

    if (startTime < "08:00" || endTime > "15:00") { Swal.fire({ icon: 'warning', title: 'Di Luar Jam Operasional', text: 'Hanya 08:00 - 15:00.' }); return; }

    // Cek Bentrok (Reload data terbaru dari storage untuk akurasi)
    const currentBookings = getBookings(); 
    const isConflict = currentBookings.some(b => {
      if (b.status === 'Completed' || parseInt(b.roomId) !== roomId || b.date !== date) return false;
      return (startTime < b.endTime && endTime > b.startTime);
    });

    if (isConflict) { Swal.fire({ icon: 'error', title: 'Jadwal Bentrok!', text: 'Ruangan sudah dipesan di jam tersebut.' }); return; }

    const newBooking = {
      id: Date.now(), roomId: roomId, roomName: selectedRoom.name,
      ...formData, pax: pax, status: 'Active'
    };

    currentBookings.push(newBooking);
    saveBookings(currentBookings);

    Swal.fire({ title: 'Berhasil!', icon: 'success' }).then(() => window.location.reload());
  };

  // Helper untuk render list jadwal per ruangan
  const renderScheduleList = (roomId) => {
    // Filter booking untuk ruangan ini yang statusnya Active
    const roomBookings = bookings
        .filter(b => parseInt(b.roomId) === roomId && b.status === 'Active')
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

    if (roomBookings.length === 0) {
        return <div className="text-muted fst-italic text-center small">Belum ada booking aktif.</div>;
    }

    return (
        <table className="table table-sm table-borderless mb-0 small">
            <tbody>
                {roomBookings.map(b => (
                    <tr key={b.id} className="border-bottom">
                        <td>
                            <strong>{b.date}</strong><br/>
                            <span className="badge bg-secondary">{b.startTime}-{b.endTime}</span>
                        </td>
                        <td className="text-end align-middle">
                            <span className="fw-bold text-primary">{b.div}</span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
  };

  if (!isLoggedIn) return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="bg-light min-vh-100 pb-5">
      <nav className="navbar navbar-dark bg-dark mb-4 sticky-top shadow-sm">
        <div className="container">
          <span className="navbar-brand mb-0 h1"><i className="bi bi-building"></i> Portal Staff</span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Logout</button>
        </div>
      </nav>

      <div className="bg-primary text-white text-center py-5 mb-4">
        <h2>Booking Ruang Meeting</h2>
        <p>Jam Operasional: Senin - Jumat (08:00 - 15:00 WIB)</p>
      </div>

      <div className="container">
        <div className="row">
          {rooms.map((room) => (
            <div className="col-md-4 mb-4" key={room.id}>
              <div className={`card room-card h-100 shadow-sm ${room.isMaintenance ? 'border-danger bg-light' : ''}`}>
                <div style={{position: 'relative'}}>
                    <span className={`badge ${room.isMaintenance ? 'bg-danger' : 'bg-success'} position-absolute top-0 end-0 m-2`}>
                        {room.isMaintenance ? 'SEDANG RENOVASI' : 'BUKA 08:00 - 15:00'}
                    </span>
                    <img src={room.img} className="card-img-top" alt={room.name} style={{ height: '200px', objectFit: 'cover', filter: room.isMaintenance ? 'grayscale(100%)' : 'none' }} />
                </div>
                
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{room.name}</h5>
                  <p className="text-muted small mb-2">Kapasitas: <strong>{room.cap} Orang</strong></p>
                  
                  {/* --- FITUR LIHAT JADWAL --- */}
                  {!room.isMaintenance && (
                      <>
                        <button 
                            className="btn btn-sm btn-outline-info w-100 mb-2" 
                            onClick={() => toggleSchedule(room.id)}
                        >
                            <i className="bi bi-calendar3"></i> {openScheduleId === room.id ? 'Tutup Jadwal' : 'Lihat Jadwal Terisi'}
                        </button>

                        {/* Area Jadwal (Muncul jika tombol diklik) */}
                        {openScheduleId === room.id && (
                            <div className="border rounded p-2 mb-3 bg-white" style={{maxHeight: '150px', overflowY: 'auto'}}>
                                {renderScheduleList(room.id)}
                            </div>
                        )}
                      </>
                  )}

                  <div className="mt-auto">
                      {room.isMaintenance ? (
                        <button className="btn btn-secondary w-100" disabled>Tidak Bisa Dipesan</button>
                      ) : (
                        <button className="btn btn-primary w-100" data-bs-toggle="modal" data-bs-target="#bookingModal" onClick={() => openBookingModal(room)}>
                            Booking Sekarang
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL BOOKING */}
      <div className="modal fade" id="bookingModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Form Booking</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              {selectedRoom && (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3"><label className="form-label">Ruangan</label><input type="text" className="form-control fw-bold" value={selectedRoom.name} readOnly disabled /></div>
                    <div className="row mb-3">
                        <div className="col-6"><label className="form-label">Divisi</label>
                            <select name="div" className="form-select" required value={formData.div} onChange={handleInputChange}>
                                <option value="">- Pilih -</option><option value="IT">IT</option><option value="HRD">HRD</option><option value="Finance">Finance</option><option value="Marketing">Marketing</option>
                            </select>
                        </div>
                        <div className="col-6"><label className="form-label">Nama PIC</label><input type="text" name="pic" className="form-control" required value={formData.pic} onChange={handleInputChange} /></div>
                    </div>
                    <div className="mb-3"><label className="form-label fw-bold">Jumlah Peserta</label>
                        <input type="number" name="pax" className="form-control" min="1" required value={formData.pax} onChange={handleInputChange} />
                        {parseInt(formData.pax) > selectedRoom.cap && (<div className="form-text text-danger">Melebihi kapasitas ({selectedRoom.cap})!</div>)}
                    </div>
                    <div className="mb-3"><label className="form-label">Konsumsi</label>
                        <select name="food" className="form-select" value={formData.food} onChange={handleInputChange}><option value="Tanpa Konsumsi">Tanpa Konsumsi</option><option value="Snack Box">Snack Box</option><option value="Makan Siang">Makan Siang</option><option value="Coffee Break">Coffee Break</option></select>
                    </div>
                    <div className="mb-3"><label className="form-label fw-bold">Tanggal</label><input type="date" name="date" className="form-control" required min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={handleInputChange} /></div>
                    <div className="row mb-3">
                        <div className="col-6"><label className="form-label fw-bold">Jam Mulai</label><input type="time" name="startTime" className="form-control" required value={formData.startTime} onChange={handleInputChange} /><div className="form-text">Min: 08:00</div></div>
                        <div className="col-6"><label className="form-label fw-bold">Jam Selesai</label><input type="time" name="endTime" className="form-control" required value={formData.endTime} onChange={handleInputChange} /><div className="form-text">Max: 15:00</div></div>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Simpan Booking</button>
                  </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}