import React, { useState, useEffect, createContext, useContext } from 'react';
import { Search, BookOpen, Star, ArrowRight, X, Loader2, CheckCircle2, LayoutDashboard, LogOut, User, BarChart3, Book as BookIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Book } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Auth Context ---
interface AuthContextType {
  user: { name: string, email: string, role: string } | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ name: string, email: string, role: string } | null>(null);

  const login = () => setUser({ name: 'Shridhar', email: 'Shridharbhinge@gmail.com', role: 'admin' });
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Components ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, login, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const trackCTA = async (name: string) => {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cta_name: name }),
    });
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
      isScrolled ? "bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <BookOpen size={24} />
          </div>
          <span className="text-2xl font-serif font-bold tracking-tight">BookLibrary</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="hover:text-primary transition-colors">Browse</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
              <LayoutDashboard size={16} /> Admin
            </Link>
          )}
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                <User size={16} className="text-slate-500" />
                <span className="text-slate-900">{user.name}</span>
              </div>
              <button onClick={logout} className="text-slate-500 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                trackCTA('Login Navbar');
                login();
              }}
              className="bg-primary text-white px-6 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              Join Now
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

      <div className="max-w-4xl mx-auto text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-serif font-bold leading-[1.1] mb-6"
        >
          Your entire world of knowledge, <br />
          <span className="text-primary italic">one click away.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto"
        >
          Discover millions of books, articles, and journals. Borrow instantly or join the waitlist for the latest bestsellers.
        </motion.p>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="relative max-w-2xl mx-auto group"
        >
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, or ISBN..."
            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-5 pl-14 pr-32 text-lg shadow-xl shadow-slate-200/50 focus:border-primary focus:ring-0 outline-none transition-all"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 bottom-2 bg-primary text-white px-8 rounded-xl font-medium hover:bg-primary/90 transition-all active:scale-95"
          >
            Search
          </button>
        </motion.form>
      </div>
    </section>
  );
};

interface BookCardProps {
  book: Book;
  onBorrow: (id: number) => void | Promise<void>;
  onLookInside: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onBorrow, onLookInside }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -10 }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 group"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img 
          src={book.cover_url} 
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
          <button 
            onClick={() => onLookInside(book)}
            className="w-full bg-white/20 backdrop-blur-md text-white py-2.5 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors mb-2"
          >
            Look Inside
          </button>
          <button 
            onClick={() => onBorrow(book.id)}
            className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {book.status === 'available' ? 'Borrow Now' : 'Join Waitlist'}
          </button>
        </div>
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full text-slate-900">
            {book.category_name}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="font-serif font-bold text-lg mb-1 line-clamp-1">{book.title}</h3>
        <p className="text-slate-500 text-sm mb-4">{book.author}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-amber-400">
            <Star size={14} fill="currentColor" />
            <span className="text-slate-900 text-xs font-bold">4.8</span>
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md",
            book.status === 'available' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
          )}>
            {book.status}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const TrustBar = () => (
  <div className="py-12 border-y border-slate-100 bg-white/50">
    <div className="max-w-7xl mx-auto px-6">
      <p className="text-center text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-8">Partnered with leading publishers</p>
      <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale">
        {['Penguin', 'HarperCollins', 'Scholastic', 'Macmillan', 'Simon & Schuster'].map(name => (
          <span key={name} className="text-xl font-serif font-bold italic">{name}</span>
        ))}
      </div>
    </div>
  </div>
);

const Testimonials = () => (
  <section className="py-24 px-6 bg-slate-900 text-white overflow-hidden relative">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-serif font-bold mb-4">What our readers say</h2>
        <p className="text-slate-400">Join a community of passionate book lovers.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { name: "Sarah Jenkins", role: "Avid Reader", text: "The 1-click borrow feature is a game changer. I've read more in the last month than I did all last year." },
          { name: "David Chen", role: "Student", text: "Finding research materials is so much easier now. The search-first interface is incredibly intuitive." },
          { name: "Elena Rodriguez", role: "Author", text: "A beautiful platform that truly respects the craft of storytelling. The UI is simply stunning." }
        ].map((t, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-lg p-8 rounded-3xl border border-white/10"
          >
            <div className="flex gap-1 text-amber-400 mb-6">
              {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="currentColor" />)}
            </div>
            <p className="text-lg italic mb-8 text-slate-200">"{t.text}"</p>
            <div className="flex items-center gap-4">
              <img src={`https://i.pravatar.cc/100?u=${t.name}`} className="w-12 h-12 rounded-full" alt={t.name} />
              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const LookInsideModal = ({ book, onClose }: { book: Book, onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm"
  >
    <motion.div 
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
    >
      <div className="w-full md:w-1/3 bg-slate-100 p-8 flex flex-col items-center justify-center text-center">
        <img src={book.cover_url} className="w-48 shadow-2xl rounded-lg mb-6" alt={book.title} />
        <h3 className="text-xl font-serif font-bold mb-2">{book.title}</h3>
        <p className="text-slate-500 text-sm">{book.author}</p>
      </div>
      <div className="flex-1 p-12 overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">
          <X size={24} />
        </button>
        <div className="prose prose-slate max-w-none">
          <h4 className="font-serif italic text-2xl mb-8">Chapter One: The Beginning</h4>
          <p className="text-slate-600 leading-relaxed mb-6">
            The sun dipped below the horizon, casting long shadows across the cobblestone streets. In the heart of the city, a small library stood as a silent sentinel of knowledge...
          </p>
          <div className="bg-slate-50 p-8 rounded-2xl border border-dashed border-slate-200 text-center">
            <p className="text-sm text-slate-500 mb-4">You've reached the end of the preview.</p>
            <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20">
              Unlock Full Book
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <motion.div
      animate={{ rotateY: [0, 180, 360] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="w-16 h-16 text-primary"
    >
      <BookOpen size={64} />
    </motion.div>
    <p className="mt-6 text-slate-400 font-medium animate-pulse">Curating your library...</p>
  </div>
);

const Home = ({ books, loading, onBorrow, onLookInside, onSearch }: any) => (
  <>
    <Hero onSearch={onSearch} />
    <TrustBar />
    <main className="max-w-7xl mx-auto px-6 py-24">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-serif font-bold mb-2">Discover Your Next Read</h2>
          <p className="text-slate-500">Explore our curated collection of knowledge.</p>
        </div>
      </div>
      {loading ? <LoadingState /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {books.map((book: Book) => (
            <BookCard key={book.id} book={book} onBorrow={onBorrow} onLookInside={onLookInside} />
          ))}
        </div>
      )}
    </main>
    <Testimonials />
  </>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="pt-32 px-6 max-w-7xl mx-auto"><LoadingState /></div>;

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-serif font-bold mb-2">Admin Dashboard</h1>
        <p className="text-slate-500">Conversion tracking and library metrics.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Loans</p>
          <p className="text-3xl font-bold">{stats.totalLoans}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Waitlist Size</p>
          <p className="text-3xl font-bold">{stats.totalWaitlist}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Conversions</p>
          <p className="text-3xl font-bold">{stats.stats.reduce((acc: number, s: any) => acc + s.count, 0)}</p>
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h3 className="font-serif font-bold text-xl">CTA Performance</h3>
        </div>
        <div className="p-8 space-y-6">
          {stats.stats.map((s: any) => (
            <div key={s.cta_name}>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>{s.cta_name}</span>
                <span>{s.count} clicks</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${(s.count / Math.max(...stats.stats.map((x: any) => x.count))) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);

  const fetchBooks = async (search = '') => {
    setLoading(true);
    const res = await fetch(`/api/books?search=${search}`);
    const data = await res.json();
    setBooks(data);
    setLoading(false);
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleBorrow = async (id: number) => {
    const res = await fetch(`/api/books/${id}/borrow`, { method: 'POST' });
    const data = await res.json();
    setToast({ message: data.message, type: 'success' });
    fetchBooks();
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home books={books} loading={loading} onBorrow={handleBorrow} onLookInside={setSelectedBook} onSearch={fetchBooks} />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
          <footer className="bg-white py-12 border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-sm text-slate-600">
              <div className="flex items-center gap-2 text-slate-900 font-serif font-bold">
                <BookOpen size={18} className="text-primary" /> BookLibrary
              </div>
              <p>© 2026 BookLibrary. All rights reserved.</p>
              <div className="flex gap-8">
                <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Contact</a>
              </div>
            </div>
          </footer>
          <AnimatePresence>
            {selectedBook && <LookInsideModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
          </AnimatePresence>
          <AnimatePresence>
            {toast && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                <CheckCircle2 className="text-emerald-400" size={20} />
                <span className="font-medium">{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
