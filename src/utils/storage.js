// Data default jika storage kosong
const defaultRooms = [
    { id: 1, name: "Meeting Room A", cap: 10, img: "https://placehold.co/600x400/2c3e50/fff?text=Room+A", isMaintenance: false },
    { id: 2, name: "Meeting Room B", cap: 20, img: "https://placehold.co/600x400/d35400/fff?text=Room+B", isMaintenance: false },
    { id: 3, name: "Meeting Room C", cap: 50, img: "https://placehold.co/600x400/27ae60/fff?text=Room+C", isMaintenance: false }
];

// Helper untuk mengambil data (aman untuk SSR Next.js)
export const getRooms = () => {
    if (typeof window === "undefined") return []; // Cek agar tidak error di server
    const stored = localStorage.getItem('appRooms');
    if (!stored) {
        localStorage.setItem('appRooms', JSON.stringify(defaultRooms));
        return defaultRooms;
    }
    return JSON.parse(stored);
};

export const saveRooms = (rooms) => {
    if (typeof window !== "undefined") localStorage.setItem('appRooms', JSON.stringify(rooms));
};

export const getBookings = () => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem('meetingBookings')) || []; } catch(e){ return []; }
};

export const saveBookings = (bookings) => {
    if (typeof window !== "undefined") localStorage.setItem('meetingBookings', JSON.stringify(bookings));
};