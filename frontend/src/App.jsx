import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEYS = {
  events: "campuspulse_frontend_events_v1",
  session: "campuspulse_frontend_session_v1",
};

const starterEvents = [
  {
    event_id: "demo-1",
    title: "Tech Innovation & AI Workshop",
    description: "Explore artificial intelligence, emerging technologies, and practical innovation through an interactive workshop.",
    category: "Workshops",
    department: "Computer Science",
    venue_name: "Auditorium A",
    start_time: "2026-10-24T09:00",
    end_time: "2026-10-24T13:00",
    total_capacity: 80,
    activity_credits: 2,
    status: "published",
  },
  {
    event_id: "demo-2",
    title: "Annual Coding Hackathon",
    description: "Build creative solutions, collaborate with other students, and put your coding skills into practice.",
    category: "Competitions",
    department: "Computer Science",
    venue_name: "Main Seminar Hall",
    start_time: "2026-10-26T09:00",
    end_time: "2026-10-26T17:00",
    total_capacity: 100,
    activity_credits: 3,
    status: "published",
  },
  {
    event_id: "demo-3",
    title: "Creative Minds Design Challenge",
    description: "Bring your ideas to life through design thinking, creativity, teamwork, and problem-solving.",
    category: "Competitions",
    department: "All Departments",
    venue_name: "Innovation Lab",
    start_time: "2026-10-28T10:00",
    end_time: "2026-10-28T15:00",
    total_capacity: 60,
    activity_credits: 2,
    status: "published",
  },
  {
    event_id: "demo-4",
    title: "Campus Cultural Fest",
    description: "Celebrate student talent with performances, music, creativity, and memorable campus experiences.",
    category: "Cultural",
    department: "Student Activities",
    venue_name: "College Grounds",
    start_time: "2026-10-30T10:00",
    end_time: "2026-10-30T18:00",
    total_capacity: 200,
    activity_credits: 3,
    status: "published",
  },
  {
    event_id: "demo-5",
    title: "Web Development Bootcamp",
    description: "Discover modern web development concepts and learn how frontend and backend applications work together.",
    category: "Technology",
    department: "Computer Science",
    venue_name: "Computer Lab 2",
    start_time: "2026-11-03T09:30",
    end_time: "2026-11-03T13:00",
    total_capacity: 50,
    activity_credits: 2,
    status: "published",
  },
  {
    event_id: "demo-6",
    title: "Inter-Department Sports Meet",
    description: "Join fellow students for a day of teamwork, friendly competition, and sporting activities.",
    category: "Sports",
    department: "Physical Education",
    venue_name: "College Sports Ground",
    start_time: "2026-11-06T08:30",
    end_time: "2026-11-06T16:00",
    total_capacity: 150,
    activity_credits: 2,
    status: "published",
  },
];

const categories = ["All Events", "Technology", "Workshops", "Competitions", "Cultural", "Sports"];

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}
function formatDate(value) {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "Time TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time TBA";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
function makePath() {
  return `${window.location.pathname}${window.location.search}`;
}

function App() {
  const [path, setPath] = useState(makePath);
  const [events, setEvents] = useState(() => readStorage(STORAGE_KEYS.events, starterEvents));
  const [users, setUsers] = useState([]);
  const [session, setSession] = useState(() => readStorage(STORAGE_KEYS.session, null));
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const onPopState = () => setPath(makePath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events)), [events]);
  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEYS.session);
  }, [session]);
   const navigate = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const logout = () => {
    setSession(null);
    navigate("/");
  };

  
const login = async (role, email, password) => {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    setNotice("Please enter your email and password.");
    return;
  }

  // Student login remains on the existing frontend prototype for now.
  if (role === "student") {
    const registered = users.find(
      (u) => u.email === cleanEmail && u.password === password
    );

    if (!registered) {
      setNotice("Invalid student email or password.");
      return;
    }

    setSession({
      role: "student",
      email: cleanEmail,
      full_name: registered.full_name,
    });

    navigate("/student");
    return;
  }

  // Admin login is verified by the backend.
  try {
    setNotice("Signing in...");

    const response = await fetch(
      "http://localhost:3000/api/auth/admin/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setNotice(data.message || "Admin login failed.");
      return;
    }

    if (data.user?.role !== "admin" || !data.token) {
      setNotice("Invalid admin authentication response.");
      return;
    }

    // Temporary session storage for the current frontend architecture.
    // Never log or display the token.
    localStorage.setItem(
      "campuspulse_admin_token",
      data.token
    );

    setSession({
      role: "admin",
      email: data.user.email,
      full_name: data.user.full_name,
    });

    setNotice("");
    navigate("/admin");
  } catch (error) {
    console.error("Admin login request failed:", error);
    setNotice(
      "Unable to connect to the server. Check whether the backend is running."
    );
  }
};
  const addEvent = (eventData) => {
    const event = { ...eventData, event_id: `local-${Date.now()}`, status: eventData.status || "published" };
    setEvents((current) => [event, ...current]);
    setNotice("Event added to this browser prototype.");
  };

  const updateEvent = (eventData) => {
    setEvents((current) => current.map((event) => String(event.event_id) === String(eventData.event_id) ? eventData : event));
    setNotice("Event updated in this browser prototype.");
  };

  const deleteEvent = (eventId) => {
    setEvents((current) => current.filter((event) => String(event.event_id) !== String(eventId)));
    setNotice("Event removed from this browser prototype.");
  };

  const currentPath = path.split("?")[0];
  const isStudentRoute = currentPath === "/student";
  const isAdminRoute = currentPath === "/admin";
  const detailsMatch = currentPath.match(/^\/events\/([^/]+)$/);
  const selectedEvent = detailsMatch
    ? events.find((event) => String(event.event_id) === decodeURIComponent(detailsMatch[1]))
    : null;
     if (isStudentRoute && session?.role !== "student") {
    return <LoginPage navigate={navigate} onLogin={login} notice="Please sign in with a student account to open the Student Portal." />;
  }
  if (isAdminRoute && session?.role !== "admin") {
    return <LoginPage navigate={navigate} onLogin={login} notice="Please sign in through Admin Login to open the Admin Portal." />;
  }

  if (currentPath === "/register") {
    return <AuthShell notice={notice} setNotice={setNotice}><SignupPage navigate={navigate} onSignup={signup} /></AuthShell>;
  }
  if (isStudentRoute) {
    return (
      <PortalShell role="student" session={session} navigate={navigate} onLogout={logout} notice={notice}>
        <StudentDashboard
          events={events.filter((event) => event.status === "published")}
          session={session}
          navigate={navigate}
        />
      </PortalShell>
    );
  }
   if (isAdminRoute) {
    return (
      <PortalShell role="admin" session={session} navigate={navigate} onLogout={logout} notice={notice}>
        <AdminDashboard events={events} onAdd={addEvent} onUpdate={updateEvent} onDelete={deleteEvent} />
      </PortalShell>
    );
  }

  if (detailsMatch && session?.role === "student") {
    if (!selectedEvent || selectedEvent.status !== "published") {
      return (
        <PortalShell role="student" session={session} navigate={navigate} onLogout={logout} notice={notice}>
          <section className="empty-state">
            <h2>Event not found</h2>
            <button className="button button-primary" type="button" onClick={() => navigate("/student")}>Back to Events</button>
          </section>
        </PortalShell>
      );
    }
 return (
      <PortalShell role="student" session={session} navigate={navigate} onLogout={logout} notice={notice}>
        <section className="admin-form-panel event-details-page">
          <button className="back-link" type="button" onClick={() => navigate("/student")}>← Back to Events</button>
          <span className="eyebrow">{selectedEvent.category || "Campus Event"}</span>
          <h2>{selectedEvent.title}</h2>
          <p>{selectedEvent.description || "No description available."}</p>
          <div className="event-meta"><span>▦ {formatDate(selectedEvent.start_time)}</span><span>· {formatTime(selectedEvent.start_time)}</span></div>
          <div className="event-meta"><span>⌖ {selectedEvent.venue_name || "Venue to be announced"}</span></div>
          <div className="event-meta"><span>♙ {selectedEvent.department || "All departments"}</span></div>
          <div className="event-meta"><span>✦ {selectedEvent.activity_credits ?? 0} credits</span><span>· {selectedEvent.total_capacity ?? "—"} seats</span></div>
        </section>
      </PortalShell>
    );
  }
    if (detailsMatch) {
    return <LoginPage navigate={navigate} onLogin={login} notice="Please sign in with a student account to view event details." />;
  }

  return <AuthShell notice={notice} setNotice={setNotice}><LoginPage navigate={navigate} onLogin={login} /></AuthShell>;
}

function AuthShell({ children, notice, setNotice }) {
  return (
    <main className="auth-layout">
      <section className="auth-visual">
        <div className="brand brand-light"><span className="brand-mark">C</span><span>CampusPulse</span></div>
        <div className="visual-copy">
          <span className="eyebrow eyebrow-light">YOUR CAMPUS. YOUR COMMUNITY.</span>
          <h1>Make campus life<br /><span>unforgettable.</span></h1>
          <p>Discover events, learn new skills, meet your people, and make every campus moment count.</p>
          <div className="visual-stats">
            <div><strong>01</strong><span>Discover</span></div>
            <div><strong>02</strong><span>Participate</span></div>
            <div><strong>03</strong><span>Grow</span></div>
          </div>
        </div>
        <div className="decor-orb orb-one" /><div className="decor-orb orb-two" />
        <div className="visual-footer">Built for curious minds and campus communities.</div>
      </section>
      <section className="auth-main">
        <div className="mobile-brand brand"><span className="brand-mark">C</span><span>CampusPulse</span></div>
        {notice && <div className="notice notice-floating"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}
        {children}
        <p className="auth-legal">CampusPulse · Student community and events platform</p>
      </section>
    </main>
  );
}
function LoginPage({ navigate, onLogin, notice: externalNotice }) {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const submit = (event) => {
    event.preventDefault();
    setLocalError("");
    onLogin(role, email, password);
  };

  return (
    <div className="auth-card-wrap">
      <div className="auth-heading">
        <span className="eyebrow">WELCOME TO CAMPUSPULSE</span>
        <h2>Good to see you<span className="purple-dot">.</span></h2>
        <p>Sign in to continue your campus journey.</p>
      </div>
      <div className="role-switch" role="tablist" aria-label="Choose login type">
        <button type="button" className={role === "student" ? "active" : ""} onClick={() => setRole("student")}><span>♙</span> Student Login</button>
        <button type="button" className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}><span>▦</span> Admin Login</button>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <label>Email address</label>
        <div className="input-wrap"><span>✉</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" autoComplete="email" required /></div>
        <label>Password</label>
        <div className="input-wrap"><span>⌑</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required /></div>
        {localError && <p className="form-error">{localError}</p>}
        {externalNotice && <p className="form-hint">{externalNotice}</p>}
        <button className="button button-primary button-wide" type="submit">Sign in <span>→</span></button>
      </form>
      {role === "student" ? <p className="auth-switch-text">New to CampusPulse? <button type="button" onClick={() => navigate("/register")}>Create an account</button></p> : <p className="auth-switch-text admin-note">Admin access is for authorized college administrators.</p>}
      <div className="auth-separator"><span /> <small>YOUR CAMPUS, CONNECTED</small> <span /></div>
      <div className="auth-benefits"><span>✦ Discover events</span><span>✦ Build experiences</span></div>
    </div>
  );
}

function SignupPage({ navigate, onSignup }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const submit = (event) => {
    event.preventDefault();
    setMessage("");
    onSignup(fullName, email, password, confirmPassword);
  };
   return (
    <div className="auth-card-wrap signup-card">
      <button className="back-link" type="button" onClick={() => navigate("/")}>← Back to login</button>
      <div className="auth-heading">
        <span className="eyebrow">JOIN YOUR CAMPUS COMMUNITY</span>
        <h2>Create your account<span className="purple-dot">.</span></h2>
        <p>One account. A whole campus of opportunities.</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <label>Full name</label>
        <div className="input-wrap"><span>♙</span><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" autoComplete="name" required /></div>
        <label>College email</label>
        <div className="input-wrap"><span>✉</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" autoComplete="email" required /></div>
        <label>Password</label>
        <div className="input-wrap"><span>⌑</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} autoComplete="new-password" required /></div>
        <label>Confirm password</label>
        <div className="input-wrap"><span>⌑</span><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Enter password again" minLength={8} autoComplete="new-password" required /></div>
        {message && <p className="form-hint">{message}</p>}
        <button className="button button-primary button-wide" type="submit">Create student account <span>→</span></button>
      </form>
      <p className="auth-switch-text">Already have an account? <button type="button" onClick={() => navigate("/")}>Sign in</button></p>
      <p className="prototype-note">Frontend preview: signup data is saved in this browser only until backend integration.</p>
    </div>
  );
}

function PortalShell({ role, session, navigate, onLogout, notice, children }) {
  const admin = role === "admin";
  return (
    <div className="portal-layout">
      <aside className="sidebar">
        <button className="brand sidebar-brand" type="button" onClick={() => navigate(admin ? "/admin" : "/student")}><span className="brand-mark">C</span><span>CampusPulse</span></button>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav">
          <button className="side-link active" type="button" onClick={() => navigate(admin ? "/admin" : "/student")}><span>▦</span>{admin ? "Admin Overview" : "Discover Events"}</button>
          {!admin && <button className="side-link" type="button" onClick={() => document.getElementById("events-section")?.scrollIntoView({ behavior: "smooth" })}><span>✦</span>Explore campus</button>}
          {admin && <div className="side-note"><span className="side-note-icon">✦</span><div><strong>Event management</strong><small>Add, update, publish and remove events right here.</small></div></div>}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><span>✧</span><strong>{admin ? "Manage the moments" : "Make it memorable"}</strong><p>{admin ? "Keep your campus calendar fresh and useful." : "Your next favorite campus memory starts here."}</p></div>
          <div className="profile-mini"><div className="avatar">{(session?.full_name || (admin ? "A" : "S")).slice(0, 1).toUpperCase()}</div><div className="profile-info"><strong>{session?.full_name || (admin ? "Administrator" : "Student")}</strong><small>{admin ? "Administrator" : "Student account"}</small></div><button type="button" className="logout-icon" onClick={onLogout} title="Sign out">↗</button></div>
        </div>
      </aside>
      <main className="portal-main">
        <header className="portal-topbar">
          <div><span className="breadcrumb">CampusPulse <span>/</span> {admin ? "Admin Portal" : "Student Portal"}</span><h1>{admin ? "Admin Portal" : "Discover your next experience"}</h1></div>
          <div className="topbar-actions"><span className="role-pill"><span className="status-dot" />{admin ? "Admin workspace" : "Student workspace"}</span><button className="icon-button" type="button" onClick={onLogout} title="Sign out">↗</button></div>
        </header>
        {notice && <div className="notice portal-notice">{notice}</div>}
        {children}
        <footer className="portal-footer">© 2026 CampusPulse <span>Made for campus communities ✦</span></footer>
      </main>
    </div>
  );
}

function StudentDashboard({ events, session, navigate }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Events");
  const [sort, setSort] = useState("soonest");
  const [registered, setRegistered] = useState([]);
  const [toast, setToast] = useState("");

  const visibleEvents = useMemo(() => {
    let list = events.filter((event) => {
      const text = `${event.title} ${event.description} ${event.category} ${event.venue_name} ${event.department}`.toLowerCase();
      return text.includes(query.toLowerCase()) && (category === "All Events" || event.category === category);
    });
    if (sort === "soonest") list = [...list].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    if (sort === "latest") list = [...list].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    if (sort === "name") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [events, query, category, sort]);

  const registerForEvent = (eventId) => {
    if (registered.includes(String(eventId))) {
      setToast("You have already marked this event as registered in this preview.");
      return;
    }
    setRegistered((current) => [...current, String(eventId)]);
    setToast("Registration button preview only — database registration will be connected in the backend step.");
  };
  return (
    <>
      <section className="student-hero">
        <div className="student-hero-copy"><span className="eyebrow eyebrow-light">CAMPUS LIFE, ALL IN ONE PLACE</span><h2>Find your next<br /><span>big moment.</span></h2><p>Workshops, competitions, cultural fests and more — find the experiences that bring your campus to life.</p><a href="#events-section" className="button button-white">Explore events <span>↓</span></a></div>
        <div className="hero-art" aria-hidden="true"><div className="art-ring ring-a" /><div className="art-ring ring-b" /><div className="art-card art-card-top"><span>✦</span><div><b>Discover</b><small>Something new</small></div></div><div className="art-card art-card-bottom"><span>↗</span><div><b>Get involved</b><small>Make it count</small></div></div><div className="art-center">CP</div></div>
        <div className="hero-caption">YOUR CAMPUS. YOUR MOMENT.</div>
      </section>
      <section className="student-stats">
        <div className="stat-item"><span className="stat-icon lavender-icon">✦</span><div><strong>{events.length}</strong><small>Published events</small></div></div>
        <div className="stat-item"><span className="stat-icon pink-icon">♧</span><div><strong>{categories.length - 1}</strong><small>Ways to get involved</small></div></div>
        <div className="stat-item"><span className="stat-icon blue-icon">♡</span><div><strong>{registered.length}</strong><small>Saved registrations</small></div></div>
      </section>
      <section className="events-section" id="events-section">
        <div className="section-heading"><div><span className="eyebrow">WHAT'S HAPPENING</span><h2>Explore campus events<span className="purple-dot">.</span></h2><p>Find something that inspires you.</p></div><span className="event-count">{visibleEvents.length} events found</span></div>
        <div className="event-controls"><div className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events, workshops, venues..." /></div><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort events"><option value="soonest">Sort: Soonest</option><option value="latest">Sort: Latest</option><option value="name">Sort: Name A–Z</option></select></div>
        <div className="category-tabs">{categories.map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={category === item ? "selected" : ""}>{item}</button>)}</div>
        {visibleEvents.length ? (
          <div className="event-grid">
            {visibleEvents.map((event, index) => (
              <EventCard
                key={event.event_id}
                event={event}
                index={index}
                registered={registered.includes(String(event.event_id))}
                onRegister={() => registerForEvent(event.event_id)}
                onViewDetails={() => navigate(`/events/${encodeURIComponent(String(event.event_id))}`)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>⌕</span><h3>No events found</h3><p>Try a different search or category.</p>
            <button className="button button-outline" type="button" onClick={() => { setQuery(""); setCategory("All Events"); }}>Clear filters</button>
          </div>
        )}
        {toast && <div className="notice toast-notice"><span>{toast}</span><button type="button" onClick={() => setToast("")}>×</button></div>}
      </section>
      <section className="community-banner"><div className="community-icon">✦</div><div><span className="eyebrow eyebrow-light">YOUR PEOPLE ARE HERE</span><h2>More than events.<br />A campus full of possibilities.</h2><p>Show up curious. Leave with a story.</p></div><div className="community-spark">✳</div></section>
    </>
  );
}
function EventCard({ event, index, registered, onRegister, onViewDetails }) {
  const palettes = ["event-art-purple", "event-art-blue", "event-art-pink", "event-art-orange", "event-art-teal", "event-art-indigo"];
  const symbols = { Technology: "⌘", Workshops: "✦", Competitions: "♜", Cultural: "♫", Sports: "↗" };
  return (
    <article className="event-card">
      <div className={`event-art ${palettes[index % palettes.length]}`}><span className="event-art-symbol">{symbols[event.category] || "✦"}</span><span className="event-category">{event.category || "Campus Event"}</span><span className="event-art-dots">•••</span></div>
      <div className="event-card-body">
        <div className="event-date-line"><span>▦</span>{formatDate(event.start_time)} <span className="date-divider">·</span> {formatTime(event.start_time)}</div>
        <h3>{event.title}</h3>
        <p className="event-description">{event.description || "Join this campus event and discover something new."}</p>
        <div className="event-meta"><span>⌖</span><span>{event.venue_name || "Venue to be announced"}</span></div>
        <div className="event-meta"><span>♙</span><span>{event.department || "All departments"}</span><span className="meta-spacer" /><span className="capacity">{event.total_capacity ?? "—"} seats</span></div>
        <div className="event-card-bottom">
          <span className="credits-badge">✦ {event.activity_credits ?? 0} credits</span>
          <button className="button button-outline" type="button" onClick={onViewDetails}>View Details <span>→</span></button>
          <button className={`button ${registered ? "button-success" : "button-primary"}`} type="button" onClick={onRegister} disabled={registered}>{registered ? "Registered ✓" : "Register now"} <span>{registered ? "" : "→"}</span></button>
        </div>
      </div>
    </article>
  );
}
function AdminDashboard({ events, onAdd, onUpdate, onDelete }) {
  const emptyForm = { title: "", description: "", category: "Technology", department: "Computer Science", venue_name: "", start_time: "", end_time: "", total_capacity: 50, activity_credits: 1, status: "published" };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const publishedCount = events.filter((event) => event.status === "published").length;
  const draftCount = events.filter((event) => event.status === "draft").length;
  const filteredEvents = events.filter((event) => {
    const matchesText = `${event.title} ${event.category} ${event.venue_name} ${event.department}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (statusFilter === "all" || event.status === statusFilter);
  });

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
    document.getElementById("admin-event-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const startEdit = (event) => {
    setEditingId(event.event_id);
    setForm({
      title: event.title || "", description: event.description || "", category: event.category || "Technology",
      department: event.department || "Computer Science", venue_name: event.venue_name || "",
      start_time: event.start_time ? String(event.start_time).slice(0, 16) : "",
      end_time: event.end_time ? String(event.end_time).slice(0, 16) : "",
      total_capacity: event.total_capacity ?? 50, activity_credits: event.activity_credits ?? 0,
      status: event.status || "published",
    });
    setFormError("");
    setFormOpen(true);
    document.getElementById("admin-event-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const submitEvent = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim() || !form.department.trim() || !form.venue_name.trim() || !form.start_time || !form.end_time) {
      setFormError("Please complete the title, department, venue, start time and end time.");
      return;
    }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setFormError("End time must be after the start time.");
      return;
    }
    if (!Number.isInteger(Number(form.total_capacity)) || Number(form.total_capacity) < 1) {
      setFormError("Capacity must be a positive whole number.");
      return;
    }
    if (Number(form.activity_credits) < 0 || !Number.isFinite(Number(form.activity_credits))) {
      setFormError("Activity credits must be zero or more.");
      return;
    }
    const cleanEvent = { ...form, title: form.title.trim(), description: form.description.trim(), department: form.department.trim(), venue_name: form.venue_name.trim(), total_capacity: Number(form.total_capacity), activity_credits: Number(form.activity_credits) };
    if (editingId !== null) onUpdate({ ...cleanEvent, event_id: editingId });
    else onAdd(cleanEvent);
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
  };
  const cancelForm = () => { setForm(emptyForm); setEditingId(null); setFormError(""); setFormOpen(false); };

  return (
    <div className="admin-content">
      <section className="admin-welcome"><div><span className="eyebrow">CAMPUSPULSE CONTROL CENTER</span><h2>Make campus moments happen<span className="purple-dot">.</span></h2><p>Create and manage your college events from one simple workspace.</p></div><button className="button button-primary" type="button" onClick={startCreate}><span>＋</span> Add new event</button></section>
      <section className="admin-stats">
        <div className="admin-stat-card"><div className="admin-stat-top"><span>Total events</span><span className="admin-stat-icon purple-icon">▦</span></div><strong>{events.length}</strong><small>Across your campus calendar</small></div>
        <div className="admin-stat-card"><div className="admin-stat-top"><span>Published</span><span className="admin-stat-icon green-icon">✓</span></div><strong>{publishedCount}</strong><small>Visible to students</small></div>
        <div className="admin-stat-card"><div className="admin-stat-top"><span>Drafts</span><span className="admin-stat-icon orange-icon">✎</span></div><strong>{draftCount}</strong><small>Not shown to students</small></div>
      </section>

      {formOpen && <section className="admin-form-panel" id="admin-event-form">
        <div className="panel-heading"><div><span className="eyebrow">{editingId !== null ? "UPDATE EVENT DETAILS" : "CREATE SOMETHING GREAT"}</span><h2>{editingId !== null ? "Edit event" : "Add a new event"}</h2><p>Fill in the details below. Students will see published events.</p></div><button className="close-button" type="button" onClick={cancelForm} aria-label="Close form">×</button></div>
        <form className="event-form" onSubmit={submitEvent}>
          <div className="form-field field-wide"><label>Event title *</label><input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="e.g. Web Development Bootcamp" required /></div>
          <div className="form-field field-wide"><label>Description</label><textarea rows="3" value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="What should students know about this event?" /></div>
          <div className="form-field"><label>Category *</label><select value={form.category} onChange={(e) => updateField("category", e.target.value)}>{categories.filter((c) => c !== "All Events").map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="form-field"><label>Department *</label><input value={form.department} onChange={(e) => updateField("department", e.target.value)} placeholder="Computer Science" required /></div>
          <div className="form-field"><label>Venue *</label><input value={form.venue_name} onChange={(e) => updateField("venue_name", e.target.value)} placeholder="Main Seminar Hall" required /></div>
          <div className="form-field"><label>Total capacity *</label><input type="number" min="1" step="1" value={form.total_capacity} onChange={(e) => updateField("total_capacity", e.target.value)} required /></div>
          <div className="form-field"><label>Start date & time *</label><input type="datetime-local" value={form.start_time} onChange={(e) => updateField("start_time", e.target.value)} required /></div>
          <div className="form-field"><label>End date & time *</label><input type="datetime-local" value={form.end_time} onChange={(e) => updateField("end_time", e.target.value)} required /></div>
          <div className="form-field"><label>Activity credits</label><input type="number" min="0" step="0.5" value={form.activity_credits} onChange={(e) => updateField("activity_credits", e.target.value)} /></div>
          <div className="form-field"><label>Visibility</label><select value={form.status} onChange={(e) => updateField("status", e.target.value)}><option value="published">Published — visible to students</option><option value="draft">Draft — hidden from students</option></select></div>
          {formError && <p className="form-error field-wide">{formError}</p>}
          <div className="form-actions field-wide"><button className="button button-outline" type="button" onClick={cancelForm}>Cancel</button><button className="button button-primary" type="submit">{editingId !== null ? "Save changes" : "Create event"} <span>→</span></button></div>
        </form>
      </section>}

      <section className="admin-events-panel">
        <div className="panel-heading admin-list-heading"><div><span className="eyebrow">YOUR CAMPUS CALENDAR</span><h2>Manage events</h2><p>Add, edit, publish or remove events in this portal.</p></div><span className="event-count">{filteredEvents.length} events</span></div>
        <div className="admin-table-controls"><div className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events..." /></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter event status"><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Drafts</option></select></div>
        <div className="admin-event-list">
          {filteredEvents.length ? filteredEvents.map((event) => <article className="admin-event-row" key={event.event_id}>
            <div className={`admin-event-symbol ${event.category === "Cultural" ? "symbol-pink" : event.category === "Sports" ? "symbol-blue" : ""}`}>{event.category === "Cultural" ? "♫" : event.category === "Sports" ? "↗" : "✦"}</div>
            <div className="admin-event-details"><div className="admin-event-title-line"><h3>{event.title}</h3><span className={`status-badge ${event.status === "published" ? "status-published" : "status-draft"}`}>{event.status || "published"}</span></div><p>{event.category} <span>·</span> {event.department}</p><div className="admin-event-meta"><span>▦ {formatDate(event.start_time)}</span><span>⌖ {event.venue_name}</span><span>♙ {event.total_capacity} seats</span></div></div>
            <div className="admin-row-actions"><button className="edit-button" type="button" onClick={() => startEdit(event)}>✎ <span>Edit</span></button><button className="delete-button" type="button" onClick={() => setConfirmDelete(event.event_id)}>⌫ <span>Delete</span></button></div>
          </article>) : <div className="empty-state compact-empty"><h3>No matching events</h3><p>Try another search or add a new event.</p></div>}
        </div>
      </section>

      {confirmDelete !== null && <div className="confirm-backdrop" role="presentation"><div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div className="confirm-icon">!</div><h2 id="delete-title">Delete this event?</h2><p>This removes the event from this browser preview. You can cancel if you selected it by mistake.</p><div className="confirm-actions"><button className="button button-outline" type="button" onClick={() => setConfirmDelete(null)}>Keep event</button><button className="button button-danger" type="button" onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}>Delete event</button></div></div></div>}
      <div className="admin-footnote"><span>ⓘ</span><p><strong>Frontend preview:</strong> event changes are saved in this browser only. We’ll connect create/update/delete to PostgreSQL and secure admin access in the backend integration step.</p></div>
    </div>
  );
}
export default App;