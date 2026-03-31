import { useState, useEffect, useRef, useCallback } from "react";

const WEATHER_API_KEY = "YOUR_OPENWEATHERMAP_API_KEY";
const LAT = 36.30;
const LON = 138.44;

const COLORS = {
  primary: "#2d6a2d",
  primaryLight: "#4a8f4a",
  primaryDark: "#1a4a1a",
  accent: "#7ab648",
  accentLight: "#a8d06b",
  bg: "#f4f8f0",
  bgCard: "#ffffff",
  bgSecondary: "#e8f2e0",
  text: "#1a2e1a",
  textMuted: "#5a7a5a",
  textLight: "#8aaa8a",
  border: "#c8e0b8",
  danger: "#c0392b",
  warning: "#e67e22",
  info: "#2980b9",
  success: "#27ae60",
};

const FIELD_SHAPES = ["rectangle", "L-shape", "triangle", "parallelogram", "custom"];

const FIELDS_INITIAL = [
  {
    id: 1, name: "あおぞら畑", reading: "あおぞらはたけ", color: "#4a8f4a",
    area: "60坪", areaM2: 198, shape: "rectangle",
    beds: [
      { crop: "onion", plants: 120, memo: "垂直仕立て・籾殻マルチ" },
      { crop: "garlic", plants: 80,  memo: "秋植え、春収穫" },
    ],
    memo: "日当たり最良。遅霜注意エリア。",
    history: [],
  },
  {
    id: 2, name: "いずみ畑", reading: "いずみはたけ", color: "#7ab648",
    area: "40坪", areaM2: 132, shape: "L-shape",
    beds: [
      { crop: "tomato",   plants: 24, memo: "自然仕立て" },
      { crop: "eggplant", plants: 18, memo: "草マルチ厚め" },
    ],
    memo: "水はけ良好。南向き斜面。",
    history: [],
  },
  {
    id: 3, name: "うみかぜ畑", reading: "うみかぜはたけ", color: "#2d6a2d",
    area: "80坪", areaM2: 264, shape: "rectangle",
    beds: [
      { crop: "wheat",   plants: 200, memo: "草生混植" },
      { crop: "soybean", plants: 150, memo: "固定種" },
    ],
    memo: "大型区画。風当たりあり。",
    history: [],
  },
  {
    id: 4, name: "えどがわ畑", reading: "えどがわはたけ", color: "#a8d06b",
    area: "50坪", areaM2: 165, shape: "parallelogram",
    beds: [
      { crop: "potato", plants: 60, memo: "草マルチ深め" },
      { crop: "taro",   plants: 30, memo: "日陰対策" },
    ],
    memo: "傾斜あり。排水溝整備済み。",
    history: [],
  },
  {
    id: 5, name: "おひさま畑", reading: "おひさまはたけ", color: "#5aa05a",
    area: "30坪", areaM2: 99, shape: "triangle",
    beds: [
      { crop: "leafy",  plants: 80, memo: "週替わり収穫" },
      { crop: "daikon", plants: 40, memo: "不耕起畝" },
    ],
    memo: "小型だが日照最良。",
    history: [],
  },
  {
    id: 6, name: "かえで畑", reading: "かえではたけ", color: "#8bc85e",
    area: "70坪", areaM2: 231, shape: "rectangle",
    beds: [],
    memo: "休耕中。レンゲ緑肥播種済み。",
    history: [],
  },
];
const FIELDS = FIELDS_INITIAL; // 後方互換エイリアス

const TASKS_INITIAL = [
  { id: 1, text: "堆肥投入（第一圃場）", done: false, priority: 1, date: new Date().toISOString().split("T")[0], field: 1, category: "施肥" },
  { id: 2, text: "雑草チェック・倒し（第三圃場）", done: false, priority: 2, date: new Date().toISOString().split("T")[0], field: 3, category: "草管理" },
  { id: 3, text: "玉ねぎ垂直仕立て確認", done: false, priority: 3, date: new Date().toISOString().split("T")[0], field: 1, category: "管理" },
  { id: 4, text: "通路籾殻補充（第二圃場）", done: false, priority: 4, date: new Date().toISOString().split("T")[0], field: 2, category: "資材" },
  { id: 5, text: "遅霜注意 - 不織布準備", done: true, priority: 5, date: new Date().toISOString().split("T")[0], field: 0, category: "防寒" },
  { id: 6, text: "麦踏み（第三圃場）", done: false, priority: 6, date: tomorrow(), field: 3, category: "管理" },
  { id: 7, text: "水やりチェック（第五圃場）", done: false, priority: 7, date: tomorrow(), field: 5, category: "水管理" },
];

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

const DICTIONARY = [
  { id: 1, term: "不耕起栽培", reading: "ふこうきさいばい", desc: "土を耕さずに栽培する自然農の基本。土壌生物を乱さず、団粒構造を保つ。小諸の粘土質土壌では特に有効。", tag: "基本技術" },
  { id: 2, term: "草生栽培", reading: "くさおいさいばい", desc: "雑草を活かして共存する農法。雑草は倒して草マルチに。川口由一氏の自然農の核心技術。", tag: "基本技術" },
  { id: 3, term: "垂直仕立て", reading: "すいちょくしたて", desc: "玉ねぎを垂直に立てて植える独自技術。分けつを促し、大玉を収穫。小諸の強風にも強い。", tag: "独自技術" },
  { id: 4, term: "籾殻堆肥", reading: "もみがらたいひ", desc: "通路に敷いた籾殻が分解されて堆肥化。土壌改良と保温・保湿を同時に行う。", tag: "資材" },
  { id: 5, term: "遅霜対策", reading: "おそじもたいさく", desc: "小諸では5月上旬まで遅霜の危険。不織布・ビニールトンネルで保護。気温3℃以下で要注意。", tag: "小諸特有" },
  { id: 6, term: "低温おだち", reading: "ていおんおだち", desc: "寒冷地特有の問題。玉ねぎが低温に遭うと花茎が立つ（おだつ）。3月以降の定植で回避。", tag: "小諸特有" },
  { id: 7, term: "木村秋則式", reading: "きむらあきのりしき", desc: "奇跡のリンゴで知られる農法。完全無農薬・無肥料。自然の力を最大限に活かす。", tag: "農法" },
  { id: 8, term: "寒暖差活用", reading: "かんだんさかつよう", desc: "小諸の標高600-1000mによる大きな寒暖差を作物の糖度・旨み向上に活用する栽培法。", tag: "小諸特有" },
  { id: 9, term: "緑肥", reading: "りょくひ", desc: "レンゲ・ヘアリーベッチなどを育てて土に鋤き込む（不耕起では倒し込む）土壌改良法。", tag: "資材" },
  { id: 10, term: "コンパニオンプランツ", reading: "こんぱにおんぷらんつ", desc: "相性の良い植物を一緒に植える。例：トマト＋バジル、ネギ＋トマトで虫忌避。", tag: "技術" },
];

const CHAT_INIT = [
  { role: "assistant", content: "こんにちは！自然農専門家のジゾーニンゲンです。🌱\n\n小諸の寒冷地環境に合わせた自然農・有機農業のご相談をお受けします。不耕起・草生栽培から、遅霜対策、垂直仕立て玉ねぎまで、何でもお聞きください。" }
];

const SYSTEM_PROMPT = `あなたは自然農専門家「ジゾーニンゲン」です。以下の原則に従って回答してください：

【農法の基本原則】
- 不耕起・草生栽培（木村秋則・川口由一の農法）を基本とする
- 通路籾殻堆肥・垂直仕立て玉ねぎ・雑草を倒す管理法を推奨
- 無肥料・無農薬を優先（化学肥料・農薬は絶対に勧めない）
- 土壌生物を大切にし、自然の循環を活かす

【小諸市の環境条件】
- 標高：600-1000m（寒冷地）
- 気候：寒暖差が大きい（夏涼しく冬厳しい）
- 問題：遅霜（5月上旬まで）、低温おだち（玉ねぎ）
- 対策：不織布、ビニールトンネル、適切な定植時期の選択

【回答スタイル】
- 現在の気温・湿度を考慮した具体的アドバイス
- ステップ分析で分かりやすく説明
- 自然農の哲学を大切にしながら実践的なアドバイスを提供
- 日本語で丁寧かつ親しみやすく回答`;

function weatherIcon(main, size = 24) {
  const icons = {
    Clear: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#f0c040"/><g stroke="#f0c040" stroke-width="1.5" stroke-linecap="round"><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></g></svg>`,
    Clouds: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#9ab8d0" stroke="#7a98b0" stroke-width="1"/></svg>`,
    Rain: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M16 13h-1.26A8 8 0 1 0 7 21h9a5 5 0 0 0 0-10z" fill="#7090b0"/><g stroke="#5080a0" stroke-width="1.5" stroke-linecap="round"><line x1="8" y1="19" x2="6" y2="23"/><line x1="12" y1="19" x2="10" y2="23"/><line x1="16" y1="19" x2="14" y2="23"/></g></svg>`,
    Snow: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#c0d8e8"/><g stroke="#8ab0c8" stroke-width="1.5" stroke-linecap="round"><line x1="8" y1="19" x2="8" y2="23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="16" y1="19" x2="16" y2="23"/><line x1="7" y1="21" x2="9" y2="21"/><line x1="11" y1="21" x2="13" y2="21"/><line x1="15" y1="21" x2="17" y2="21"/></g></svg>`,
    Thunderstorm: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M19 9h-1.26A8 8 0 1 0 10 18h9a5 5 0 0 0 0-10z" fill="#6060a0"/><polyline points="13,11 11,17 14,17 12,23" stroke="#f0c040" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
    Drizzle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M16 13h-1.26A8 8 0 1 0 7 21h9a5 5 0 0 0 0-10z" fill="#9ab8d0"/><g stroke="#7090b0" stroke-width="1" stroke-linecap="round"><line x1="9" y1="19" x2="8" y2="22"/><line x1="13" y1="19" x2="12" y2="22"/><line x1="17" y1="19" x2="16" y2="22"/></g></svg>`,
    Mist: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><g stroke="#a0b8c0" stroke-width="1.5" stroke-linecap="round"><line x1="3" y1="10" x2="21" y2="10"/><line x1="5" y1="14" x2="19" y2="14"/><line x1="3" y1="18" x2="21" y2="18"/></g></svg>`,
  };
  return icons[main] || icons.Clouds;
}

function WeatherIconSVG({ main, size = 24 }) {
  return <span dangerouslySetInnerHTML={{ __html: weatherIcon(main, size) }} />;
}

function getMockWeather() {
  return {
    current: { temp: 8.2, humidity: 65, description: "晴れ時々曇り", main: "Clear", rain: 10, feelsLike: 5.8, wind: 3.2 },
    hourly: [
      { time: "9時", temp: 8, main: "Clear", rain: 5 },
      { time: "13時", temp: 14, main: "Clear", rain: 5 },
      { time: "17時", temp: 10, main: "Clouds", rain: 20 },
      { time: "21時", temp: 5, main: "Clouds", rain: 30 },
    ],
    daily: [
      { day: "今日", high: 15, low: 2, main: "Clear", rain: 10 },
      { day: "明日", high: 12, low: 0, main: "Clouds", rain: 40 },
      { day: "明後日", high: 8, low: -1, main: "Rain", rain: 80 },
      { day: "木曜", high: 10, low: 1, main: "Clouds", rain: 30 },
    ]
  };
}

// ── 初期ユーザーデータ ──────────────────────────────────────────
const INITIAL_USERS = [
  { id: "admin", password: "admin123", name: "管理者", role: "admin", avatar: "", bio: "", joinedAt: "2024-01-01" },
  { id: "farmer1", password: "pass1", name: "田中太郎", role: "user", avatar: "", bio: "小諸で自然農を10年", joinedAt: "2024-03-01" },
];

// ── 認証コンテキスト（storageを使った簡易セッション） ──────────
function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // タイムアウト付きでstorage復元。どの経路でも必ずauthChecked=trueになる
    let done = false;
    const finish = () => { if (!done) { done = true; setAuthChecked(true); } };

    // 500ms以内に終わらなければ強制完了
    const timer = setTimeout(finish, 500);

    async function restore() {
      try {
        if (typeof window.storage?.get === "function") {
          const r = await window.storage.get("session_user");
          if (r?.value) {
            const saved = JSON.parse(r.value);
            try {
              const usersR = await window.storage.get("users_data");
              if (usersR?.value) setUsers(JSON.parse(usersR.value));
            } catch {}
            setCurrentUser(saved);
          }
        }
      } catch {}
      clearTimeout(timer);
      finish();
    }

    restore();
    return () => clearTimeout(timer);
  }, []);

  async function login(id, password) {
    const u = users.find(u => u.id === id && u.password === password);
    if (!u) return false;
    setCurrentUser(u);
    try { await window.storage?.set("session_user", JSON.stringify(u)); } catch {}
    return true;
  }

  async function logout() {
    setCurrentUser(null);
    try { await window.storage?.delete("session_user"); } catch {}
  }

  async function updateUser(updated) {
    const newUsers = users.map(u => u.id === updated.id ? updated : u);
    setUsers(newUsers);
    setCurrentUser(updated);
    try {
      await window.storage?.set("users_data", JSON.stringify(newUsers));
      await window.storage?.set("session_user", JSON.stringify(updated));
    } catch {}
  }

  async function createUser(newUser) {
    if (users.find(u => u.id === newUser.id)) return "このIDは既に使われています";
    if (newUser.id.length < 2) return "IDは2文字以上にしてください";
    if (!newUser.password) return "パスワードを入力してください";
    const u = { ...newUser, role: "user", avatar: "", bio: "", joinedAt: new Date().toISOString().split("T")[0] };
    const newUsers = [...users, u];
    setUsers(newUsers);
    try { await window.storage?.set("users_data", JSON.stringify(newUsers)); } catch {}
    return null;
  }

  async function deleteUser(id) {
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
    try { await window.storage?.set("users_data", JSON.stringify(newUsers)); } catch {}
  }

  return { currentUser, users, authChecked, login, logout, updateUser, createUser, deleteUser };
}

export default function App() {
  const auth = useAuth();
  const [tab, setTab] = useState("home");
  const [showSettings, setShowSettings] = useState(false);
  const [weather, setWeather] = useState(getMockWeather());
  const [tasks, setTasks] = useState(TASKS_INITIAL);
  const [fields, setFields] = useState(FIELDS_INITIAL);
  const [chatMessages, setChatMessages] = useState(CHAT_INIT);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [dictSearch, setDictSearch] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ text: "", field: 0, category: "管理", date: new Date().toISOString().split("T")[0] });
  const [dragTask, setDragTask] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // 認証チェック中
  if (!auth.authChecked) {
    return (
      <div style={{ fontFamily: "'Noto Sans JP',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: COLORS.bg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
          <div style={{ fontSize: 14, color: COLORS.textMuted }}>読み込み中...</div>
        </div>
      </div>
    );
  }

  // 未ログイン → ログイン画面
  if (!auth.currentUser) {
    return <LoginScreen auth={auth} />;
  }

  // 設定画面
  if (showSettings) {
    return <SettingsScreen auth={auth} onClose={() => setShowSettings(false)} />;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(t => t.date === todayStr);
  const upcomingTasks = tasks.filter(t => t.date > todayStr).slice(0, 8);

  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }
  function editTask(updated) {
    setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
  }
  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function addTask() {
    if (!newTask.text.trim()) return;
    setTasks(prev => [...prev, { ...newTask, id: Date.now(), done: false, priority: prev.length + 1 }]);
    setNewTask({ text: "", field: 0, category: "管理", date: new Date().toISOString().split("T")[0] });
    setShowAddTask(false);
  }

  function handleDragStart(task) { setDragTask(task); }
  function handleDragOver(e, id) { e.preventDefault(); setDragOver(id); }
  function handleDrop(targetId) {
    if (!dragTask || dragTask.id === targetId) { setDragTask(null); setDragOver(null); return; }
    setTasks(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(t => t.id === dragTask.id);
      const toIdx = arr.findIndex(t => t.id === targetId);
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr.map((t, i) => ({ ...t, priority: i + 1 }));
    });
    setDragTask(null); setDragOver(null);
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user", content: chatInput };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const weatherCtx = `現在の小諸市の天気: 気温${weather.current.temp}℃、湿度${weather.current.humidity}%、${weather.current.description}`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT + `\n\n${weatherCtx}`,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "申し訳ありません、エラーが発生しました。";
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "接続エラーが発生しました。ネットワークを確認してください。" }]);
    }
    setChatLoading(false);
  }

  const filteredDict = DICTIONARY.filter(d =>
    d.term.includes(dictSearch) || d.reading.includes(dictSearch) || d.desc.includes(dictSearch) || d.tag.includes(dictSearch)
  );

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", background: COLORS.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>
        {tab === "home" && <HomeTab weather={weather} tasks={tasks} todayTasks={todayTasks} upcomingTasks={upcomingTasks} toggleTask={toggleTask} editTask={editTask} deleteTask={deleteTask} handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDrop={handleDrop} dragOver={dragOver} dragTask={dragTask} showAddTask={showAddTask} setShowAddTask={setShowAddTask} newTask={newTask} setNewTask={setNewTask} addTask={addTask} fields={fields} setFields={setFields} currentUser={auth.currentUser} onOpenSettings={() => setShowSettings(true)} users={auth.users} />}
        {tab === "calendar" && <CalendarTab weather={weather} tasks={tasks} calendarDate={calendarDate} setCalendarDate={setCalendarDate} selectedDay={selectedDay} setSelectedDay={setSelectedDay} toggleTask={toggleTask} showAddTask={showAddTask} setShowAddTask={setShowAddTask} newTask={newTask} setNewTask={setNewTask} addTask={addTask} users={auth.users} />}
        {tab === "ai" && <AITab chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} chatLoading={chatLoading} chatEndRef={chatEndRef} weather={weather} />}
        {tab === "map" && <MapTab weather={weather} fields={fields} setFields={setFields} />}
        {tab === "dict" && <DictTab currentUser={auth.currentUser} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function HomeTab({ weather, todayTasks, upcomingTasks, tasks, toggleTask, editTask, deleteTask, handleDragStart, handleDragOver, handleDrop, dragOver, dragTask, showAddTask, setShowAddTask, newTask, setNewTask, addTask, fields, setFields, currentUser, onOpenSettings, users }) {
  const [detailId,     setDetailId]     = useState(null);
  const [editId,       setEditId]       = useState(null);
  const [showAddField, setShowAddField] = useState(false);
  const [editingTask,  setEditingTask]  = useState(null);

  const sorted = [...fields].sort((a, b) => a.reading.localeCompare(b.reading, "ja"));
  const detail = sorted.find(f => f.id === detailId);

  if (detailId && detail) {
    return <FieldDetail field={detail} fields={fields} setFields={setFields} tasks={tasks} onBack={() => setDetailId(null)} />;
  }

  return (
    <div>
      {/* ── 天気ヘッダー ── */}
      <div style={{ background: `linear-gradient(160deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 60%, ${COLORS.primaryLight} 100%)`, padding: "20px 16px 16px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.85 }}>🌿</span>
          <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.9 }}>小諸市の天気</span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>標高 600-1000m</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {currentUser && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", border: "1.5px solid rgba(255,255,255,0.5)", overflow: "hidden" }}>
                  {currentUser.avatar
                    ? <img src={currentUser.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : currentUser.name.charAt(0)}
                </div>
                <span style={{ fontSize: 11, opacity: 0.9 }}>{currentUser.name}</span>
              </div>
            )}
            <button onClick={onOpenSettings} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <WeatherIconSVG main={weather.current.main} size={52} />
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{weather.current.temp}°C</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>{weather.current.description}</div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>💧 {weather.current.humidity}%</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>☔ {weather.current.rain}%</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>🌡 体感 {weather.current.feelsLike}°C</div>
          </div>
        </div>
        {weather.current.temp < 5 && (
          <div style={{ marginTop: 8, background: "rgba(255,100,50,0.3)", borderRadius: 6, padding: "5px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            ⚠️ 低温注意：遅霜リスクあり。不織布を準備してください。
          </div>
        )}
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {weather.hourly.map((h, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{h.time}</div>
              <WeatherIconSVG main={h.main} size={20} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{h.temp}°</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>☔{h.rain}%</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
          {weather.daily.map((d, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: "5px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{d.day}</div>
              <WeatherIconSVG main={d.main} size={16} />
              <div style={{ fontSize: 11 }}><span style={{ color: "#ffcc44" }}>{d.high}°</span> / <span style={{ opacity: 0.7 }}>{d.low}°</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 今日のやること ── */}
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, display: "flex", alignItems: "center", gap: 6 }}>
            <span>📋</span> 今日のやること
          </div>
          <button onClick={() => setShowAddTask(true)} style={{ background: COLORS.accent, color: "white", border: "none", borderRadius: 16, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>+ 追加</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {todayTasks.length === 0 && <div style={{ color: COLORS.textMuted, fontSize: 13, padding: "10px 0" }}>今日のタスクはありません</div>}
          {todayTasks.map(task => (
            <TaskItem key={task.id} task={task} toggleTask={toggleTask} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} isDragOver={dragOver === task.id} isDragging={dragTask?.id === task.id} onEdit={setEditingTask} fields={fields} users={users} />
          ))}
        </div>
      </div>

      {/* ── 圃場一覧（あいうえお順） ── */}
      <div style={{ padding: "14px 16px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🌾</span> 圃場一覧
            <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 400 }}>あいうえお順</span>
          </div>
          <button onClick={() => setShowAddField(true)} style={{ background: COLORS.primary, color: "white", border: "none", borderRadius: 16, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>+ 追加</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((f, idx) => {
            const totalPlants = f.beds.reduce((s, b) => s + (Number(b.plants) || 0), 0);
            const cropEmojis = [...new Set(f.beds.map(b => gcrop(b.crop).e))].slice(0, 3).join(" ");
            const shapeSvg = SHAPE_ICONS[f.shape] || SHAPE_ICONS["rectangle"];
            return (
              <div key={f.id} onClick={() => setDetailId(f.id)}
                style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all .12s", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                {/* reading index badge */}
                <div style={{ width: 32, height: 32, borderRadius: 8, background: f.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {f.reading.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{f.name}</span>
                    <span style={{ fontSize: 10, color: COLORS.textLight, background: COLORS.bgSecondary, padding: "1px 6px", borderRadius: 6 }}>{f.area}</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {f.beds.length > 0 ? `${cropEmojis} ${f.beds.length}畝・${totalPlants}株` : "畝なし（休耕中）"}
                  </div>
                </div>
                {/* shape mini icon */}
                <div style={{ flexShrink: 0, opacity: 0.6 }}>{shapeSvg}</div>
                <span style={{ color: COLORS.textLight, fontSize: 16, flexShrink: 0 }}>›</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4週間予定 ── */}
      <div style={{ padding: "14px 16px 20px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <span>📅</span> 4週間の予定
        </div>
        {[0, 1, 2, 3].map(weekOffset => {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() + weekOffset * 7 - weekStart.getDay() + 1);
          const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
          const weekTasks = tasks.filter(t => { const td = new Date(t.date); return td >= weekDays[0] && td <= weekDays[6]; });
          return (
            <div key={weekOffset} style={{ background: COLORS.bgCard, borderRadius: 10, border: `1px solid ${COLORS.border}`, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ background: weekOffset === 0 ? COLORS.primary : COLORS.bgSecondary, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: weekOffset === 0 ? "white" : COLORS.primary }}>
                {weekOffset === 0 ? "今週" : `第${weekOffset + 1}週`}：{weekDays[0].getMonth() + 1}/{weekDays[0].getDate()} 〜 {weekDays[6].getMonth() + 1}/{weekDays[6].getDate()}
              </div>
              <div style={{ padding: "8px 12px", display: "flex", flexWrap: "wrap", gap: 4 }}>
                {weekTasks.length === 0
                  ? <span style={{ fontSize: 12, color: COLORS.textLight }}>予定なし</span>
                  : weekTasks.slice(0, 4).map(t => (
                    <span key={t.id} style={{ fontSize: 11, background: t.done ? COLORS.bgSecondary : COLORS.accentLight, color: t.done ? COLORS.textMuted : COLORS.primaryDark, padding: "2px 8px", borderRadius: 10, textDecoration: t.done ? "line-through" : "none" }}>{t.text.slice(0, 14)}</span>
                  ))}
                {weekTasks.length > 4 && <span style={{ fontSize: 11, color: COLORS.textMuted }}>+{weekTasks.length - 4}件</span>}
              </div>
            </div>
          );
        })}
      </div>

      {editingTask && <EditTaskModal task={editingTask} fields={fields} users={users} onSave={t => { editTask(t); setEditingTask(null); }} onDelete={id => { deleteTask(id); setEditingTask(null); }} onClose={() => setEditingTask(null)} />}
      {showAddTask && <AddTaskModal newTask={newTask} setNewTask={setNewTask} addTask={addTask} onClose={() => setShowAddTask(false)} users={users} />}
      {showAddField && <AddFieldModal fields={fields} setFields={setFields} onClose={() => setShowAddField(false)} />}
    </div>
  );
}

// ── 畑の形SVGアイコン ────────────────────────────────────────────
const SHAPE_ICONS = {
  "rectangle":    <svg width="28" height="22" viewBox="0 0 28 22"><rect x="1" y="1" width="26" height="20" rx="2" fill="none" stroke="#8aaa8a" strokeWidth="1.5"/></svg>,
  "L-shape":      <svg width="28" height="22" viewBox="0 0 28 22"><polygon points="1,1 14,1 14,11 27,11 27,21 1,21" fill="none" stroke="#8aaa8a" strokeWidth="1.5"/></svg>,
  "triangle":     <svg width="28" height="22" viewBox="0 0 28 22"><polygon points="14,1 27,21 1,21" fill="none" stroke="#8aaa8a" strokeWidth="1.5"/></svg>,
  "parallelogram":<svg width="28" height="22" viewBox="0 0 28 22"><polygon points="7,1 27,1 21,21 1,21" fill="none" stroke="#8aaa8a" strokeWidth="1.5"/></svg>,
  "custom":       <svg width="28" height="22" viewBox="0 0 28 22"><polygon points="4,1 24,4 26,18 14,21 2,16" fill="none" stroke="#8aaa8a" strokeWidth="1.5"/></svg>,
};
const SHAPE_LABELS = { "rectangle":"長方形", "L-shape":"L字形", "triangle":"三角形", "parallelogram":"平行四辺形", "custom":"カスタム" };

// ── 圃場詳細画面 ────────────────────────────────────────────────
function FieldDetail({ field, fields, setFields, tasks, onBack }) {
  const [tab, setTab]       = useState("beds");   // beds | memo | history
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]   = useState({ ...field, beds: field.beds.map(b=>({...b})) });

  function save() {
    setFields(prev => prev.map(f => f.id === field.id ? { ...draft } : f));
    setEditing(false);
  }

  const fieldTasks = tasks.filter(t => t.field === field.id);
  const totalPlants = field.beds.reduce((s, b) => s + (Number(b.plants) || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg }}>
      {/* header */}
      <div style={{ background: `linear-gradient(150deg, ${COLORS.primaryDark}, ${COLORS.primary})`, color: "white", padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 8, padding: "5px 10px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>‹ 一覧</button>
          <span style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>{field.name}</span>
          <button onClick={() => setEditing(true)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 8, padding: "5px 10px", fontSize: 13, cursor: "pointer" }}>✏️ 編集</button>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px", fontSize: 11 }}>📐 {field.area}（{field.areaM2}㎡）</div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px", fontSize: 11 }}>{SHAPE_LABELS[field.shape] || field.shape}</div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px", fontSize: 11 }}>🌱 {totalPlants}株</div>
        </div>
      </div>

      {/* shape visual */}
      <div style={{ background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
        <ShapeVisual shape={field.shape} color={field.color} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>圃場の形</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{SHAPE_LABELS[field.shape] || field.shape}</div>
          {field.memo && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{field.memo}</div>}
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}` }}>
        {[["beds","🌿 畝・作物"],["memo","📝 メモ"],["history","📖 記録"]].map(([id,lbl])=>(
          <div key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:"10px 0", textAlign:"center", fontSize:12, fontWeight:700, cursor:"pointer", color:tab===id?COLORS.primary:COLORS.textLight, borderBottom:`2px solid ${tab===id?COLORS.primary:"transparent"}` }}>{lbl}</div>
        ))}
      </div>

      <div style={{ padding: "12px 16px 80px" }}>
        {tab === "beds" && <BedListView field={field} />}
        {tab === "memo"  && <MemoView field={field} tasks={fieldTasks} />}
        {tab === "history" && <HistoryView field={field} />}
      </div>

      {editing && <FieldEditModal field={draft} setDraft={setDraft} onSave={save} onClose={()=>setEditing(false)} />}
    </div>
  );
}

// ── 畝グリッド表示 ──────────────────────────────────────────────
function BedListView({ field }) {
  if (field.beds.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"30px 0", color:COLORS.textMuted }}>
        <div style={{ fontSize:40, marginBottom:8 }}>🌾</div>
        <div style={{ fontSize:14 }}>まだ畝がありません</div>
        <div style={{ fontSize:12, marginTop:4 }}>編集ボタンから畝を追加できます</div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {field.beds.map((b, i) => {
          const c = gcrop(b.crop);
          return (
            <div key={i} style={{ background:COLORS.bgCard, border:`1px solid ${COLORS.border}`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ background: c.col + "33", borderBottom:`1px solid ${COLORS.border}`, padding:"10px 12px", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:28 }}>{c.e}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:COLORS.text }}>{c.lbl}</div>
                  <div style={{ fontSize:11, color:COLORS.textMuted }}>畝 {i+1}</div>
                </div>
              </div>
              <div style={{ padding:"8px 12px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:11, color:COLORS.textMuted }}>株数</span>
                  <span style={{ fontWeight:700, fontSize:14, color:COLORS.primary }}>{b.plants || "未設定"}株</span>
                </div>
                {b.memo && <div style={{ fontSize:11, color:COLORS.textMuted, background:COLORS.bgSecondary, borderRadius:6, padding:"4px 8px", marginTop:4 }}>{b.memo}</div>}
              </div>
              {/* mini plant grid */}
              <PlantGrid crop={b.crop} plants={Number(b.plants)||0} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlantGrid({ crop, plants }) {
  const c = gcrop(crop);
  if (!plants || plants === 0) return null;
  const show = Math.min(plants, 20);
  const cols = Math.min(show, 5);
  return (
    <div style={{ padding:"6px 10px 8px", borderTop:`1px solid ${COLORS.border}`, background:"#f8fbf6" }}>
      <div style={{ fontSize:9, color:COLORS.textLight, marginBottom:4 }}>配置イメージ（先頭{show}株）</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:2 }}>
        {Array.from({length:show}).map((_,i)=>(
          <span key={i} style={{ fontSize:13, lineHeight:1 }}>{c.e}</span>
        ))}
        {plants > 20 && <span style={{ fontSize:10, color:COLORS.textLight, alignSelf:"center" }}>+{plants-20}</span>}
      </div>
    </div>
  );
}

// ── メモビュー ───────────────────────────────────────────────────
function MemoView({ field, tasks }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {field.memo && (
        <div style={{ background:COLORS.bgCard, border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"12px 14px" }}>
          <div style={{ fontSize:12, fontWeight:700, color:COLORS.primary, marginBottom:6 }}>📝 圃場メモ</div>
          <div style={{ fontSize:14, color:COLORS.text, lineHeight:1.7 }}>{field.memo}</div>
        </div>
      )}
      <div style={{ background:COLORS.bgCard, border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"12px 14px" }}>
        <div style={{ fontSize:12, fontWeight:700, color:COLORS.primary, marginBottom:6 }}>📋 関連タスク ({tasks.length}件)</div>
        {tasks.length===0
          ? <div style={{ fontSize:13, color:COLORS.textMuted }}>関連タスクなし</div>
          : tasks.map(t=>(
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:`1px solid ${COLORS.border}` }}>
              <div style={{ width:14, height:14, borderRadius:"50%", background:t.done?COLORS.success:COLORS.border, flexShrink:0 }} />
              <span style={{ fontSize:13, color:t.done?COLORS.textMuted:COLORS.text, textDecoration:t.done?"line-through":"none" }}>{t.text}</span>
              <span style={{ marginLeft:"auto", fontSize:10, color:COLORS.textLight }}>{t.date}</span>
            </div>
          ))
        }
      </div>
      {/* future slots */}
      {[["📷 写真","将来: 圃場写真を記録"],["🤖 AIアドバイス","将来: ジゾーニンゲンのアドバイス"]].map(([icon,txt])=>(
        <div key={icon} style={{ background:COLORS.bgSecondary, border:`1px dashed ${COLORS.border}`, borderRadius:10, padding:"14px", display:"flex", alignItems:"center", gap:10, opacity:0.6 }}>
          <span style={{ fontSize:22 }}>{icon.split(" ")[0]}</span>
          <span style={{ fontSize:12, color:COLORS.textMuted }}>{txt}</span>
        </div>
      ))}
    </div>
  );
}

// ── 作業記録ビュー ───────────────────────────────────────────────
function HistoryView({ field }) {
  return (
    <div>
      {field.history && field.history.length > 0
        ? field.history.map((h,i)=>(
          <div key={i} style={{ background:COLORS.bgCard, border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"10px 14px", marginBottom:8 }}>
            <div style={{ fontSize:11, color:COLORS.textLight }}>{h.date}</div>
            <div style={{ fontSize:13, color:COLORS.text, marginTop:2 }}>{h.text}</div>
          </div>
        ))
        : (
          <div style={{ textAlign:"center", padding:"30px 0", color:COLORS.textMuted }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📖</div>
            <div style={{ fontSize:14 }}>作業記録はまだありません</div>
            <div style={{ fontSize:12, marginTop:4, color:COLORS.textLight }}>将来: 作業日誌・収穫記録を追加予定</div>
          </div>
        )
      }
    </div>
  );
}

// ── 圃場の形ビジュアル ────────────────────────────────────────────
function ShapeVisual({ shape, color, size = 80, outline, pxPerM }) {
  // If a custom outline polygon exists, render it scaled into the thumbnail
  if (outline && outline.length >= 3) {
    const xs = outline.map(v => v.x), ys = outline.map(v => v.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rw = maxX - minX || 1, rh = maxY - minY || 1;
    const pad = 6;
    const scaleX = (size - pad*2) / rw, scaleY = (size - pad*2) / rh;
    const sc = Math.min(scaleX, scaleY);
    const ox = pad + ((size - pad*2) - rw*sc) / 2;
    const oy = pad + ((size - pad*2) - rh*sc) / 2;
    const pts = outline.map(v => `${ox+(v.x-minX)*sc},${oy+(v.y-minY)*sc}`).join(" ");
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0}}>
        <polygon points={pts} fill={color+"33"} stroke={color} strokeWidth="2"/>
      </svg>
    );
  }
  const fills = { opacity: 0.25 };
  const shapes = {
    "rectangle":     <rect x="4" y="8" width="72" height="54" rx="3" fill={color} {...fills} stroke={color} strokeWidth="2"/>,
    "L-shape":       <polygon points="4,8 44,8 44,35 76,35 76,62 4,62" fill={color} {...fills} stroke={color} strokeWidth="2"/>,
    "triangle":      <polygon points="40,8 76,62 4,62" fill={color} {...fills} stroke={color} strokeWidth="2"/>,
    "parallelogram": <polygon points="20,8 76,8 60,62 4,62" fill={color} {...fills} stroke={color} strokeWidth="2"/>,
    "custom":        <polygon points="14,8 66,12 72,52 40,62 8,48" fill={color} {...fills} stroke={color} strokeWidth="2"/>,
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0 }}>
      {shapes[shape] || shapes["rectangle"]}
    </svg>
  );
}

// ── 圃場編集モーダル ─────────────────────────────────────────────
function FieldEditModal({ field, setDraft, onSave, onClose }) {
  const d = field;
  const up = (k,v) => setDraft(prev=>({...prev,[k]:v}));
  const upBed = (i,k,v) => setDraft(prev=>{ const beds=[...prev.beds]; beds[i]={...beds[i],[k]:v}; return {...prev,beds}; });
  const addBed = () => setDraft(prev=>({...prev, beds:[...prev.beds,{crop:"onion",plants:"",memo:""}]}));
  const delBed = (i) => setDraft(prev=>({...prev, beds:prev.beds.filter((_,idx)=>idx!==i)}));

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"flex-end", zIndex:200 }}>
      <div style={{ background:"#fff", borderRadius:"16px 16px 0 0", padding:20, width:"100%", maxWidth:480, margin:"0 auto", maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:16 }}>
          <span style={{ fontWeight:700, fontSize:16, color:COLORS.text, flex:1 }}>✏️ 圃場を編集</span>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:COLORS.textLight }}>✕</button>
        </div>

        {/* 基本情報 */}
        {[["名前","name","text","例：あおぞら畑"],["読み","reading","text","例：あおぞらはたけ"],["面積","area","text","例：60坪"],["面積(㎡)","areaM2","number","例：198"]].map(([lbl,key,type,ph])=>(
          <div key={key} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <span style={{ fontSize:12, color:COLORS.textMuted, width:60, flexShrink:0 }}>{lbl}</span>
            <input value={d[key]||""} onChange={e=>up(key, type==="number"?Number(e.target.value):e.target.value)} placeholder={ph} type={type}
              style={{ flex:1, border:`1px solid ${COLORS.border}`, borderRadius:7, padding:"8px 10px", fontSize:13 }} />
          </div>
        ))}

        {/* カラー */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <span style={{ fontSize:12, color:COLORS.textMuted, width:60 }}>カラー</span>
          <input type="color" value={d.color} onChange={e=>up("color",e.target.value)} style={{ width:50, height:34, border:`1px solid ${COLORS.border}`, borderRadius:7, padding:2, cursor:"pointer" }} />
          <div style={{ width:34, height:34, borderRadius:8, background:d.color }} />
        </div>

        {/* 形 */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, color:COLORS.textMuted, marginBottom:6 }}>圃場の形</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
            {FIELD_SHAPES.map(s=>(
              <div key={s} onClick={()=>up("shape",s)} style={{ border:`1px solid ${d.shape===s?COLORS.primary:COLORS.border}`, borderRadius:8, padding:"8px 6px", textAlign:"center", cursor:"pointer", background:d.shape===s?COLORS.bgSecondary:"#fff" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:4 }}>{SHAPE_ICONS[s]}</div>
                <div style={{ fontSize:10, fontWeight:d.shape===s?700:400, color:d.shape===s?COLORS.primary:COLORS.textMuted }}>{SHAPE_LABELS[s]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* メモ */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, color:COLORS.textMuted, marginBottom:4 }}>メモ</div>
          <textarea value={d.memo||""} onChange={e=>up("memo",e.target.value)} rows={2} style={{ width:"100%", border:`1px solid ${COLORS.border}`, borderRadius:7, padding:"8px 10px", fontSize:13, resize:"none", boxSizing:"border-box" }} />
        </div>

        {/* 畝リスト */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:COLORS.text }}>畝 ({d.beds.length}本)</span>
            <button onClick={addBed} style={{ background:COLORS.accent, color:"white", border:"none", borderRadius:12, padding:"4px 12px", fontSize:12, cursor:"pointer" }}>+ 追加</button>
          </div>
          {d.beds.map((b,i)=>{
            const c=gcrop(b.crop);
            return (
              <div key={i} style={{ background:COLORS.bgSecondary, borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:COLORS.text }}>畝 {i+1}　{c.e} {c.lbl}</span>
                  <button onClick={()=>delBed(i)} style={{ background:"none", border:"none", cursor:"pointer", color:COLORS.danger, fontSize:16 }}>✕</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5, marginBottom:8 }}>
                  {CROP_DEFS.map(cr=>(
                    <div key={cr.id} onClick={()=>upBed(i,"crop",cr.id)} style={{ border:`1px solid ${b.crop===cr.id?COLORS.primary:COLORS.border}`, borderRadius:7, padding:"5px 3px", textAlign:"center", cursor:"pointer", background:b.crop===cr.id?COLORS.bgCard:"transparent", fontSize:10 }}>
                      <div style={{ fontSize:18 }}>{cr.e}</div>
                      <div>{cr.lbl}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input type="number" placeholder="株数" value={b.plants||""} onChange={e=>upBed(i,"plants",e.target.value)}
                    style={{ flex:1, border:`1px solid ${COLORS.border}`, borderRadius:7, padding:"7px 10px", fontSize:13 }} />
                  <input placeholder="メモ" value={b.memo||""} onChange={e=>upBed(i,"memo",e.target.value)}
                    style={{ flex:2, border:`1px solid ${COLORS.border}`, borderRadius:7, padding:"7px 10px", fontSize:13 }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, border:`1px solid ${COLORS.border}`, background:"transparent", borderRadius:8, padding:11, fontSize:14, cursor:"pointer" }}>キャンセル</button>
          <button onClick={onSave} style={{ flex:2, background:COLORS.primary, border:"none", borderRadius:8, padding:11, fontSize:14, fontWeight:700, color:"#fff", cursor:"pointer" }}>保存</button>
        </div>
      </div>
    </div>
  );
}

// ── 圃場追加モーダル ─────────────────────────────────────────────
function AddFieldModal({ fields, setFields, onClose }) {
  const FIELD_COLORS_LIST = ["#4a8f4a","#7ab648","#2d6a2d","#a8d06b","#5aa05a","#8bc85e","#e67e22","#9b59b6","#2980b9","#c0392b"];
  const [data, setData] = useState({ name:"", reading:"", area:"", areaM2:"", shape:"rectangle", color: FIELD_COLORS_LIST[fields.length % FIELD_COLORS_LIST.length], memo:"" });
  const up = (k,v) => setData(d=>({...d,[k]:v}));

  function save() {
    if (!data.name.trim() || !data.reading.trim()) return;
    setFields(prev=>[...prev, { ...data, id:Date.now(), areaM2:Number(data.areaM2)||0, beds:[], history:[] }]);
    onClose();
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"flex-end", zIndex:200 }}>
      <div style={{ background:"#fff", borderRadius:"16px 16px 0 0", padding:20, width:"100%", maxWidth:480, margin:"0 auto", maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:16 }}>
          <span style={{ fontWeight:700, fontSize:16, color:COLORS.text, flex:1 }}>🌾 新しい圃場を追加</span>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:COLORS.textLight }}>✕</button>
        </div>
        {[["名前 *","name","text","例：さくら畑"],["読み *","reading","text","例：さくらはたけ（あいうえお順に使用）"],["面積","area","text","例：30坪"],["面積(㎡)","areaM2","number","例：99"]].map(([lbl,key,type,ph])=>(
          <div key={key} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <span style={{ fontSize:12, color:COLORS.textMuted, width:60, flexShrink:0 }}>{lbl}</span>
            <input value={data[key]||""} onChange={e=>up(key,e.target.value)} placeholder={ph} type={type}
              style={{ flex:1, border:`1px solid ${data[key]?"":COLORS.danger+44}`, borderRadius:7, padding:"8px 10px", fontSize:13 }} />
          </div>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <span style={{ fontSize:12, color:COLORS.textMuted, width:60 }}>カラー</span>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {FIELD_COLORS_LIST.map(col=>(
              <div key={col} onClick={()=>up("color",col)} style={{ width:28, height:28, borderRadius:6, background:col, border:`2px solid ${data.color===col?COLORS.primaryDark:"transparent"}`, cursor:"pointer" }} />
            ))}
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, color:COLORS.textMuted, marginBottom:6 }}>形</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
            {FIELD_SHAPES.map(s=>(
              <div key={s} onClick={()=>up("shape",s)} style={{ border:`1px solid ${data.shape===s?COLORS.primary:COLORS.border}`, borderRadius:8, padding:"7px 5px", textAlign:"center", cursor:"pointer", background:data.shape===s?COLORS.bgSecondary:"#fff" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:3 }}>{SHAPE_ICONS[s]}</div>
                <div style={{ fontSize:10, fontWeight:data.shape===s?700:400 }}>{SHAPE_LABELS[s]}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:COLORS.textMuted, marginBottom:4 }}>メモ</div>
          <textarea value={data.memo} onChange={e=>up("memo",e.target.value)} rows={2} placeholder="場所・特徴など" style={{ width:"100%", border:`1px solid ${COLORS.border}`, borderRadius:7, padding:"8px 10px", fontSize:13, resize:"none", boxSizing:"border-box" }} />
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, border:`1px solid ${COLORS.border}`, background:"transparent", borderRadius:8, padding:11, fontSize:14, cursor:"pointer" }}>キャンセル</button>
          <button onClick={save} disabled={!data.name||!data.reading} style={{ flex:2, background:data.name&&data.reading?COLORS.primary:COLORS.border, border:"none", borderRadius:8, padding:11, fontSize:14, fontWeight:700, color:"#fff", cursor:"pointer" }}>追加</button>
        </div>
      </div>
    </div>
  );
}

function TaskItem({ task, toggleTask, onDragStart, onDragOver, onDrop, isDragOver, isDragging, onEdit, fields = [], users = [] }) {
  const field    = fields.find(f => f.id === task.field) || FIELDS.find(f => f.id === task.field);
  const assignee = task.assigneeId ? users.find(u => u.id === task.assigneeId) : null;
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      onDragOver={e => onDragOver(e, task.id)}
      onDrop={() => onDrop(task.id)}
      style={{
        background: task.done ? "#f0f8ee" : COLORS.bgCard,
        border: `1px solid ${isDragOver ? COLORS.primary : COLORS.border}`,
        borderRadius: 10,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
        transition: "all 0.15s",
        boxShadow: isDragOver ? `0 2px 8px ${COLORS.primary}30` : "none",
      }}
    >
      <span style={{ fontSize: 14, color: COLORS.textLight }}>⠿</span>
      <button onClick={() => toggleTask(task.id)} style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${task.done ? COLORS.success : COLORS.border}`, background: task.done ? COLORS.success : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {task.done && <span style={{ color: "white", fontSize: 12, lineHeight: 1 }}>✓</span>}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: task.done ? COLORS.textMuted : COLORS.text, textDecoration: task.done ? "line-through" : "none", fontWeight: 500 }}>{task.text}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, background: COLORS.bgSecondary, color: COLORS.primary, padding: "1px 6px", borderRadius: 6 }}>{task.category}</span>
          {field && <span style={{ fontSize: 10, background: field.color + "22", color: field.color, padding: "1px 6px", borderRadius: 6 }}>{field.name}</span>}
          {assignee && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, background: "#e8f0ff", color: "#2d5ab0", padding: "1px 6px", borderRadius: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#c0d0f0", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, overflow: "hidden", flexShrink: 0 }}>
                {assignee.avatar
                  ? <img src={assignee.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (assignee.name || assignee.id).charAt(0)}
              </span>
              {assignee.name || assignee.id}
            </span>
          )}
        </div>
      </div>
      {onEdit && (
        <button
          onClick={e => { e.stopPropagation(); onEdit(task); }}
          style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "4px 8px", cursor: "pointer", fontSize: 13, color: COLORS.textMuted, flexShrink: 0 }}
        >✏️</button>
      )}
    </div>
  );
}

function EditTaskModal({ task, onSave, onDelete, onClose, fields = [], users = [] }) {
  const [draft, setDraft] = useState({ ...task });
  const up = (k, v) => setDraft(p => ({ ...p, [k]: v }));
  const allFields = fields.length > 0 ? fields : FIELDS;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
      <div style={{ background: COLORS.bgCard, borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxWidth: 480, margin: "0 auto", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, flex: 1 }}>✏️ タスクを編集</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textLight }}>✕</button>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>作業内容</label>
          <input value={draft.text} onChange={e => up("text", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 14, boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>カテゴリ</label>
            <select value={draft.category} onChange={e => up("category", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }}>
              {["管理","草管理","施肥","水管理","資材","収穫","種まき","防寒"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>圃場</label>
            <select value={draft.field || 0} onChange={e => up("field", Number(e.target.value))}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }}>
              <option value={0}>圃場未定</option>
              {allFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>日付</label>
          <input type="date" value={draft.date} onChange={e => up("date", e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, boxSizing: "border-box" }} />
        </div>

        {/* ── 担当者 ── */}
        {users.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, color: COLORS.textMuted, display: "block", marginBottom: 8 }}>担当者</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* なし */}
              <button onClick={() => up("assigneeId", null)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: COLORS.bgSecondary, border: `2.5px solid ${!draft.assigneeId ? COLORS.primary : COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "border-color .15s" }}>
                  –
                </div>
                <span style={{ fontSize: 10, color: !draft.assigneeId ? COLORS.primary : COLORS.textLight, fontWeight: !draft.assigneeId ? 700 : 400 }}>なし</span>
              </button>
              {/* ユーザー */}
              {users.map(u => {
                const sel = draft.assigneeId === u.id;
                return (
                  <button key={u.id} onClick={() => up("assigneeId", u.id)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: COLORS.bgSecondary, border: `2.5px solid ${sel ? COLORS.primary : COLORS.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, transition: "border-color .15s", position: "relative" }}>
                      {u.avatar
                        ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 16 }}>{(u.name || u.id).charAt(0)}</span>}
                      {sel && (
                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: "50%", background: COLORS.primary, border: "1.5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#fff", fontSize: 8, lineHeight: 1 }}>✓</span>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: sel ? COLORS.primary : COLORS.textLight, fontWeight: sel ? 700 : 400, maxWidth: 50, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.name || u.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onDelete(task.id)}
            style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.danger}`, background: "transparent", color: COLORS.danger, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            🗑 削除
          </button>
          <button onClick={onClose}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", fontSize: 14, cursor: "pointer" }}>
            キャンセル
          </button>
          <button onClick={() => onSave(draft)} disabled={!draft.text.trim()}
            style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: draft.text.trim() ? COLORS.primary : COLORS.border, color: "white", fontSize: 14, fontWeight: 700, cursor: draft.text.trim() ? "pointer" : "default" }}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTaskModal({ newTask, setNewTask, addTask, onClose, users = [] }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
      <div style={{ background: COLORS.bgCard, borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: COLORS.text }}>タスクを追加</div>
        <input value={newTask.text} onChange={e => setNewTask(p => ({ ...p, text: e.target.value }))} placeholder="作業内容を入力..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 14, marginBottom: 10, boxSizing: "border-box" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <select value={newTask.field} onChange={e => setNewTask(p => ({ ...p, field: Number(e.target.value) }))} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }}>
            <option value={0}>圃場未定</option>
            {FIELDS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }}>
            {["管理", "草管理", "施肥", "水管理", "資材", "収穫", "種まき", "防寒"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <input type="date" value={newTask.date} onChange={e => setNewTask(p => ({ ...p, date: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, marginBottom: 10, boxSizing: "border-box" }} />

        {/* 担当者選択 */}
        {users.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>担当者</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div
                onClick={() => setNewTask(p => ({ ...p, assigneeId: null }))}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: COLORS.bgSecondary, border: `2px solid ${!newTask.assigneeId ? COLORS.primary : COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>–</div>
                <span style={{ fontSize: 9, color: !newTask.assigneeId ? COLORS.primary : COLORS.textLight, fontWeight: !newTask.assigneeId ? 700 : 400 }}>なし</span>
              </div>
              {users.map(u => (
                <div
                  key={u.id}
                  onClick={() => setNewTask(p => ({ ...p, assigneeId: u.id }))}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: COLORS.bgSecondary, border: `2px solid ${newTask.assigneeId === u.id ? COLORS.primary : COLORS.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>
                    {u.avatar
                      ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 14 }}>{u.name.charAt(0)}</span>}
                  </div>
                  <span style={{ fontSize: 9, color: newTask.assigneeId === u.id ? COLORS.primary : COLORS.textLight, fontWeight: newTask.assigneeId === u.id ? 700 : 400, maxWidth: 44, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", fontSize: 14, cursor: "pointer" }}>キャンセル</button>
          <button onClick={addTask} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: COLORS.primary, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>追加する</button>
        </div>
      </div>
    </div>
  );
}

function CalendarTab({ weather, tasks, calendarDate, setCalendarDate, selectedDay, setSelectedDay, toggleTask, showAddTask, setShowAddTask, newTask, setNewTask, addTask, users = [] }) {
  const today = new Date();
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const todayStr = today.toISOString().split("T")[0];

  function getTasksForDay(day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter(t => t.date === dateStr);
  }

  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  // 当月の全タスクを日付順に並べる
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd   = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const monthTasks = tasks
    .filter(t => t.date >= monthStart && t.date <= monthEnd)
    .sort((a, b) => a.date.localeCompare(b.date));

  // 日付ごとにグループ化
  const tasksByDate = monthTasks.reduce((acc, t) => {
    acc[t.date] = acc[t.date] || [];
    acc[t.date].push(t);
    return acc;
  }, {});

  const DAYS_JP = ["日","月","火","水","木","金","土"];

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* ── 月ナビ ── */}
      <div style={{ background: COLORS.primary, padding: "16px 16px 12px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setCalendarDate(new Date(year, month - 1))} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: 32, height: 32, fontSize: 18, cursor: "pointer" }}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{year}年 {month + 1}月</span>
          <button onClick={() => setCalendarDate(new Date(year, month + 1))} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: 32, height: 32, fontSize: 18, cursor: "pointer" }}>›</button>
        </div>
      </div>

      {/* ── カレンダーグリッド ── */}
      <div style={{ background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center" }}>
          {["日","月","火","水","木","金","土"].map((d, i) => (
            <div key={d} style={{ padding: "6px 0", fontSize: 11, color: i===0?"#c0392b":i===6?"#2980b9":COLORS.textMuted, fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const isToday    = day===today.getDate() && month===today.getMonth() && year===today.getFullYear();
            const isSelected = day===selectedDay;
            const dayTasks   = getTasksForDay(day);
            const dow        = (firstDay + day - 1) % 7;
            const doneAll    = dayTasks.length > 0 && dayTasks.every(t => t.done);
            return (
              <div key={day} onClick={() => setSelectedDay(isSelected ? null : day)} style={{ padding: "4px 2px", textAlign: "center", cursor: "pointer" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: isToday?"#c0392b":isSelected?COLORS.primary:"transparent", color: isToday||isSelected?"white":dow===0?"#c0392b":dow===6?"#2980b9":COLORS.text, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontWeight: isToday?700:400 }}>{day}</div>
                {dayTasks.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2 }}>
                    {dayTasks.slice(0, 3).map((t, i) => (
                      <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: t.done?COLORS.success:COLORS.accent }} />
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 9, color: COLORS.textLight, marginTop: 1 }}>
                  {day % 3 === 0 ? `${Math.round(weather.daily[day%4]?.high||12)}°` : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 選択日のタスク（タップ詳細） ── */}
      {selectedDay && (
        <div style={{ margin: "10px 16px 0", background: COLORS.bgCard, border: `1.5px solid ${COLORS.primary}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ background: COLORS.primary, padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "white" }}>
              {month+1}月{selectedDay}日（{DAYS_JP[(new Date(year,month,selectedDay)).getDay()]}）
            </span>
            <button onClick={() => setSelectedDay(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 16, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ padding: "8px 12px" }}>
            {selectedTasks.length === 0
              ? <div style={{ color: COLORS.textMuted, fontSize: 13, padding: "6px 0" }}>この日のタスクはありません</div>
              : selectedTasks.map(t => (
                <div key={t.id} onClick={() => toggleTask(t.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${t.done?COLORS.success:COLORS.border}`, background: t.done?COLORS.success:"transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {t.done && <span style={{ color:"white", fontSize:10 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: t.done?COLORS.textMuted:COLORS.text, textDecoration: t.done?"line-through":"none", flex: 1 }}>{t.text}</span>
                  <span style={{ fontSize: 10, background: COLORS.bgSecondary, color: COLORS.primary, padding: "2px 6px", borderRadius: 6 }}>{t.category}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── 日付順やることリスト ── */}
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text, display: "flex", alignItems: "center", gap: 6 }}>
            <span>📋</span> {year}年{month+1}月のやること
            <span style={{ fontSize: 11, fontWeight: 400, color: COLORS.textMuted }}>日付順</span>
          </div>
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{monthTasks.length}件</span>
        </div>

        {monthTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: COLORS.textMuted }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>📭</div>
            <div style={{ fontSize: 13 }}>この月のタスクはありません</div>
          </div>
        ) : (
          Object.entries(tasksByDate).map(([dateStr, dateTasks]) => {
            const d       = new Date(dateStr);
            const dayNum  = d.getDate();
            const dow     = d.getDay();
            const isToday = dateStr === todayStr;
            const isPast  = dateStr < todayStr;
            const doneAll = dateTasks.every(t => t.done);
            return (
              <div key={dateStr} style={{ marginBottom: 12 }}>
                {/* 日付ヘッダー */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: isToday?COLORS.primary:doneAll?"#e8f8e8":isPast?"#f4f4f4":COLORS.bgSecondary, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, border: isToday?`2px solid ${COLORS.primaryDark}`:`1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isToday?"white":dow===0?"#c0392b":dow===6?"#2980b9":COLORS.text, lineHeight: 1 }}>{dayNum}</span>
                    <span style={{ fontSize: 9, color: isToday?"rgba(255,255,255,0.8)":COLORS.textLight, lineHeight: 1 }}>{DAYS_JP[dow]}</span>
                  </div>
                  <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                  <span style={{ fontSize: 10, color: doneAll?COLORS.success:COLORS.textLight, fontWeight: doneAll?700:400 }}>
                    {doneAll ? "✓ 完了" : `${dateTasks.filter(t=>t.done).length}/${dateTasks.length}`}
                  </span>
                </div>
                {/* タスクカード */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: 44 }}>
                  {dateTasks.map(t => {
                    const assignee = t.assigneeId ? users.find(u => u.id === t.assigneeId) : null;
                    return (
                      <div key={t.id} onClick={() => toggleTask(t.id)}
                        style={{ background: t.done?"#f0f8ee":COLORS.bgCard, border: `1px solid ${t.done?COLORS.success+"44":COLORS.border}`, borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${t.done?COLORS.success:COLORS.border}`, background: t.done?COLORS.success:"transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {t.done && <span style={{ color:"white", fontSize:11 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 13, color: t.done?COLORS.textMuted:COLORS.text, textDecoration: t.done?"line-through":"none", flex: 1 }}>{t.text}</span>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                          <span style={{ fontSize: 10, background: COLORS.bgSecondary, color: COLORS.primary, padding: "2px 6px", borderRadius: 6 }}>{t.category}</span>
                          {assignee && (
                            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, background: "#e8f0ff", color: "#2d5ab0", padding: "2px 6px", borderRadius: 6 }}>
                              <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#c0d0f0", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, overflow: "hidden", flexShrink: 0 }}>
                                {assignee.avatar ? <img src={assignee.avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/> : assignee.name.charAt(0)}
                              </span>
                              {assignee.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button onClick={() => setShowAddTask(true)} style={{ position: "fixed", bottom: 82, right: 16, width: 52, height: 52, borderRadius: "50%", background: COLORS.primary, color: "white", border: "none", fontSize: 24, cursor: "pointer", boxShadow: "0 3px 12px rgba(0,0,0,0.25)", zIndex: 50 }}>+</button>
      {showAddTask && <AddTaskModal newTask={newTask} setNewTask={setNewTask} addTask={addTask} onClose={() => setShowAddTask(false)} users={users} />}
    </div>
  );
}

function AITab({ chatMessages, chatInput, setChatInput, sendChat, chatLoading, chatEndRef, weather }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 72px)" }}>
      <div style={{ background: COLORS.primary, padding: "14px 16px 12px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: COLORS.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧙</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>ジゾーニンゲン</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>自然農専門 AI アシスタント</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 11, opacity: 0.8, textAlign: "right" }}>
            <div>小諸 {weather.current.temp}°C</div>
            <div>湿度 {weather.current.humidity}%</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {chatMessages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.bgSecondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginRight: 8, alignSelf: "flex-end" }}>🧙</div>
            )}
            <div style={{
              maxWidth: "78%",
              background: msg.role === "user" ? COLORS.primary : COLORS.bgCard,
              color: msg.role === "user" ? "white" : COLORS.text,
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              padding: "10px 14px",
              fontSize: 13,
              lineHeight: 1.6,
              border: msg.role === "assistant" ? `1px solid ${COLORS.border}` : "none",
              whiteSpace: "pre-wrap",
            }}>{msg.content}</div>
          </div>
        ))}
        {chatLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.bgSecondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧙</div>
            <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "10px 16px", display: "flex", gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.primary, animation: `pulse 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ padding: "10px 16px 12px", background: COLORS.bgCard, borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, overflowX: "auto", paddingBottom: 2 }}>
          {["遅霜対策を教えて", "玉ねぎの管理方法", "今の気温での作業は？", "雑草の倒し方"].map(s => (
            <button key={s} onClick={() => setChatInput(s)} style={{ background: COLORS.bgSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "4px 10px", fontSize: 11, color: COLORS.primary, cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500 }}>{s}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="ジゾーニンゲンに相談する..." style={{ flex: 1, padding: "10px 14px", borderRadius: 22, border: `1px solid ${COLORS.border}`, fontSize: 14, outline: "none" }} />
          <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ width: 42, height: 42, borderRadius: "50%", background: chatInput.trim() ? COLORS.primary : COLORS.border, border: "none", color: "white", fontSize: 18, cursor: chatInput.trim() ? "pointer" : "default", flexShrink: 0 }}>↑</button>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,60%,100%{transform:scale(0.8);opacity:0.4} 30%{transform:scale(1.2);opacity:1} }`}</style>
    </div>
  );
}

const CROP_DEFS = [
  { id: "onion",    lbl: "玉ねぎ",     e: "🧅", col: "#f5a623", rc: 15, rr: 15, notes: "垂直仕立て" },
  { id: "tomato",   lbl: "トマト",     e: "🍅", col: "#e74c3c", rc: 50, rr: 50, notes: "自然仕立て" },
  { id: "eggplant", lbl: "ナス",       e: "🍆", col: "#9b59b6", rc: 50, rr: 50, notes: "" },
  { id: "wheat",    lbl: "麦",         e: "🌾", col: "#d4ac0d", rc: 20, rr: 20, notes: "草生混植" },
  { id: "soybean",  lbl: "大豆",       e: "🫘", col: "#a04000", rc: 30, rr: 30, notes: "" },
  { id: "potato",   lbl: "じゃがいも", e: "🥔", col: "#ca6f1e", rc: 40, rr: 40, notes: "" },
  { id: "taro",     lbl: "里芋",       e: "🌿", col: "#1e8449", rc: 50, rr: 50, notes: "" },
  { id: "leafy",    lbl: "葉物",       e: "🥬", col: "#27ae60", rc: 25, rr: 25, notes: "" },
  { id: "daikon",   lbl: "大根",       e: "🌱", col: "#85929e", rc: 30, rr: 30, notes: "" },
  { id: "garlic",   lbl: "にんにく",   e: "🧄", col: "#b7950b", rc: 15, rr: 15, notes: "" },
  { id: "pumpkin",  lbl: "かぼちゃ",   e: "🎃", col: "#e67e22", rc: 80, rr: 80, notes: "つる性" },
  { id: "fallow",   lbl: "休耕",       e: "🌿", col: "#7ab648", rc: 0,  rr: 0,  notes: "緑肥管理" },
];

// ── 畝テンプレート（長辺m × 短辺m）
const BED_TEMPLATES = [
  { id: "50x2", label: "50m × 2m", wM: 50, hM: 2 },
  { id: "25x2", label: "25m × 2m", wM: 25, hM: 2 },
  { id: "10x2", label: "10m × 2m", wM: 10, hM: 2 },
  { id: "5x1",  label: "5m × 1m",  wM: 5,  hM: 1 },
  { id: "3x1",  label: "3m × 1m",  wM: 3,  hM: 1 },
];
const BASE_PX_PER_M = 4;
const MIN_VIS_PX    = 30;

function gcrop(id) { return CROP_DEFS.find(c => c.id === id) || CROP_DEFS[0]; }
function hexA(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function snapV(val, gridPx) { return Math.round(val / gridPx) * gridPx; }
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function bedPxW(b, ppm) { return b.rotated ? Math.max(MIN_VIS_PX, b.hM * ppm) : Math.max(MIN_VIS_PX * (b.wM / b.hM), b.wM * ppm); }
function bedPxH(b, ppm) { return b.rotated ? Math.max(MIN_VIS_PX * (b.wM / b.hM), b.wM * ppm) : Math.max(MIN_VIS_PX, b.hM * ppm); }

// ─── MapTab: 一覧 → 設計マップ ────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║  MapTab  — 俯瞰マップ → 畝設計マップ                        ║
// ╚══════════════════════════════════════════════════════════════╝
function MapTab({ weather, fields, setFields }) {

  // ── view layer ───────────────────────────────────────────────
  const [layer, setLayer] = useState("overview"); // "overview" | "design"
  const [activeId, setActiveId] = useState(null);

  // ── overview map state ───────────────────────────────────────
  const ovCanvasRef = useRef(null);
  const ovWrapRef   = useRef(null);
  const ovSt        = useRef({});   // mutable interaction state

  // fieldRects: { [id]: {x, y, w, h, rot} }  — positions on overview canvas
  const [fieldRects, setFieldRects] = useState(() => {
    const out = {};
    let cx = 60, cy = 60;
    FIELDS.forEach((f, i) => {
      out[f.id] = { x: cx, y: cy, w: 160, h: 100, rot: 0 };
      cx += 180;
      if (cx > 480) { cx = 60; cy += 130; }
    });
    return out;
  });
  const [ovZoom,  setOvZoom]  = useState(1);
  const [ovPan,   setOvPan]   = useState({ x: 0, y: 0 });
  const [selOvId, setSelOvId] = useState(null);

  const fieldRectsRef = useRef(fieldRects);
  const ovZoomRef     = useRef(ovZoom);
  const ovPanRef      = useRef(ovPan);
  const selOvRef      = useRef(selOvId);
  useEffect(() => { fieldRectsRef.current = fieldRects; }, [fieldRects]);
  useEffect(() => { ovZoomRef.current = ovZoom; },         [ovZoom]);
  useEffect(() => { ovPanRef.current  = ovPan; },          [ovPan]);
  useEffect(() => { selOvRef.current  = selOvId; },        [selOvId]);

  // ── design map state ─────────────────────────────────────────
  const dsCanvasRef = useRef(null);
  const dsWrapRef   = useRef(null);
  const dsSt        = useRef({});

  const [dsZoom,      setDsZoom]      = useState(3);
  const [beds,        setBeds]        = useState({});   // { fieldId: bed[] }
  const [outlines,    setOutlines]    = useState({});   // { fieldId: [{x,y}] }
  const [selBedId,    setSelBedId]    = useState(null);
  const [placingTpl,  setPlacingTpl]  = useState(null);
  const [editBed,     setEditBed]     = useState(null);
  const [dsMode,      setDsMode]      = useState("bed"); // "bed" | "outline"
  const [selVtx,      setSelVtx]      = useState(null);
  const [showAddField,setShowAddField]= useState(false);

  const dsZoomRef  = useRef(dsZoom);
  const selBedRef  = useRef(selBedId);
  const placRef    = useRef(placingTpl);
  const dsModeRef  = useRef(dsMode);
  const selVtxRef  = useRef(selVtx);

  const curBeds    = (activeId && beds[activeId])     ? beds[activeId]     : [];
  const curOutline = (activeId && outlines[activeId]) ? outlines[activeId] : [];
  const curBedsRef = useRef(curBeds);
  const curOutRef  = useRef(curOutline);

  useEffect(() => { dsZoomRef.current  = dsZoom;      }, [dsZoom]);
  useEffect(() => { selBedRef.current  = selBedId;    }, [selBedId]);
  useEffect(() => { placRef.current    = placingTpl;  }, [placingTpl]);
  useEffect(() => { dsModeRef.current  = dsMode;      }, [dsMode]);
  useEffect(() => { selVtxRef.current  = selVtx;      }, [selVtx]);
  useEffect(() => { curBedsRef.current = curBeds;     }, [curBeds]);
  useEffect(() => { curOutRef.current  = curOutline;  }, [curOutline]);

  const setCurBeds = upd => setBeds(p => ({ ...p, [activeId]: typeof upd==="function"?upd(p[activeId]||[]):upd }));
  const setCurOut  = upd => setOutlines(p => ({ ...p, [activeId]: typeof upd==="function"?upd(p[activeId]||[]):upd }));

  // ── handler refs (allows useEffect to call functions defined later) ──
  const ovDownRef = useRef(null);
  const ovMoveRef = useRef(null);
  const ovUpRef   = useRef(null);
  const dsDownRef = useRef(null);
  const dsMoveRef = useRef(null);
  const dsUpRef   = useRef(null);
  const drawOv = useCallback(() => {
    const cv  = ovCanvasRef.current;
    const wrp = ovWrapRef.current;
    if (!cv || !wrp) return;
    const W = cv.width, H = cv.height;
    const ctx = cv.getContext("2d");
    const zoom = ovZoomRef.current;
    const pan  = ovPanRef.current;
    const sel  = selOvRef.current;
    const rects = fieldRectsRef.current;

    ctx.clearRect(0,0,W,H);

    // map background
    ctx.fillStyle = "#e8f4dc";
    ctx.fillRect(0,0,W,H);

    // grid (1 grid = 10m)
    const gridM = 10, gridPx = gridM * 4 * zoom;
    ctx.strokeStyle = "rgba(100,140,80,0.2)"; ctx.lineWidth = 0.5;
    for (let x=(pan.x%gridPx+gridPx)%gridPx; x<W; x+=gridPx) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
    for (let y=(pan.y%gridPx+gridPx)%gridPx; y<H; y+=gridPx) { ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke(); }

    // north arrow
    ctx.fillStyle="#4a7a4a"; ctx.font="11px sans-serif"; ctx.textAlign="left"; ctx.textBaseline="top";
    ctx.fillText("N ↑",8,8);

    // scale bar: 50m
    const barPx = 50 * 4 * zoom;
    if (barPx < W*0.4) {
      const bx=W-barPx-12, by=H-14;
      ctx.fillStyle="#4a7a4a"; ctx.fillRect(bx,by,barPx,3);
      ctx.fillRect(bx,by-3,2,9); ctx.fillRect(bx+barPx-2,by-3,2,9);
      ctx.font="9px sans-serif"; ctx.textAlign="center"; ctx.fillText("50m",bx+barPx/2,by-12);
    }

    // fields
    const sortedF = [...fields].sort((a,b)=>a.reading.localeCompare(b.reading,"ja"));
    sortedF.forEach(f => {
      const rawR = rects[f.id];
      // fallback: auto-generate rect if not yet in fieldRects
      const r = rawR || (() => {
        const idx = sortedF.indexOf(f);
        return { x: 60 + (idx % 3) * 180, y: 60 + Math.floor(idx / 3) * 130, w: 160, h: 100, rot: 0 };
      })();
      if (!r) return;
      const isSel = sel === f.id;

      // transform: pan + zoom
      const tx = r.x * zoom + pan.x;
      const ty = r.y * zoom + pan.y;
      const tw = r.w * zoom;
      const th = r.h * zoom;

      ctx.save();
      ctx.translate(tx + tw/2, ty + th/2);
      ctx.rotate((r.rot||0) * Math.PI/180);

      // shadow
      if (isSel) { ctx.fillStyle="rgba(0,0,0,0.15)"; ctx.fillRect(-tw/2+3,-th/2+3,tw,th); }

      // fill
      ctx.fillStyle = hexA(f.color, 0.35);
      ctx.fillRect(-tw/2,-th/2,tw,th);

      // border
      ctx.strokeStyle = isSel ? "#1a4a1a" : f.color;
      ctx.lineWidth   = isSel ? 2.5 : 1.5;
      ctx.strokeRect(-tw/2,-th/2,tw,th);

      // selection ring
      if (isSel) {
        ctx.strokeStyle="rgba(45,106,45,0.5)"; ctx.lineWidth=1; ctx.setLineDash([4,3]);
        ctx.strokeRect(-tw/2-5,-th/2-5,tw+10,th+10); ctx.setLineDash([]);
      }

      // label
      const lfs = Math.max(9, Math.min(14, tw*0.12));
      ctx.font = `bold ${lfs}px sans-serif`;
      ctx.fillStyle = "#1a3a1a"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(f.name, 0, -6, tw-8);
      ctx.font = `${Math.max(8,lfs-2)}px sans-serif`; ctx.fillStyle="#4a6a4a";
      ctx.fillText(f.area, 0, 6+lfs*0.3, tw-8);

      // custom outline thumbnail
      const fOut = (outlines[f.id]||[]);
      if (fOut.length >= 3) {
        const xs=fOut.map(v=>v.x), ys=fOut.map(v=>v.y);
        const mnx=Math.min(...xs),mxx=Math.max(...xs),mny=Math.min(...ys),mxy=Math.max(...ys);
        const sc=Math.min((tw-8)/(mxx-mnx||1),(th-16)/(mxy-mny||1));
        ctx.beginPath();
        fOut.forEach((v,i)=>{
          const px=-tw/2+4+(v.x-mnx)*sc, py=-th/2+8+(v.y-mny)*sc;
          i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
        });
        ctx.closePath();
        ctx.strokeStyle=f.color; ctx.lineWidth=1.2; ctx.stroke();
      }

      ctx.restore();
    });
  }, [fields, outlines]);

  // overview resize
  useEffect(() => {
    if (layer !== "overview") return;
    const cv = ovCanvasRef.current, wrp = ovWrapRef.current;
    if (!cv||!wrp) return;
    const ro = new ResizeObserver(() => { cv.width=wrp.clientWidth; cv.height=wrp.clientHeight; drawOv(); });
    ro.observe(wrp);
    cv.width=wrp.clientWidth; cv.height=wrp.clientHeight;
    drawOv();

    // ── native touch listeners (passive:false でピンチ操作を確実に制御) ──
    const onTS = e => { e.preventDefault(); ovDownRef.current?.(e); };
    const onTM = e => { e.preventDefault(); ovMoveRef.current?.(e); };
    const onTE = e => { e.preventDefault(); ovUpRef.current?.(e); };
    wrp.addEventListener("touchstart",  onTS, { passive: false });
    wrp.addEventListener("touchmove",   onTM, { passive: false });
    wrp.addEventListener("touchend",    onTE, { passive: false });
    wrp.addEventListener("touchcancel", onTE, { passive: false });

    // ── wheel zoom (トラックパッドのピンチ・マウスホイール) ──
    const onWheel = e => {
      e.preventDefault();
      const delta = e.deltaY || e.deltaX;
      const factor = delta > 0 ? 0.92 : 1.08;
      // zoom toward cursor position
      const r   = cv.getBoundingClientRect();
      const mx  = e.clientX - r.left;
      const my  = e.clientY - r.top;
      setOvZoom(z => {
        const nz = Math.min(4, Math.max(0.3, z * factor));
        const dz = nz - z;
        setOvPan(p => ({ x: p.x - mx * dz / z, y: p.y - my * dz / z }));
        return nz;
      });
    };
    wrp.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      ro.disconnect();
      wrp.removeEventListener("touchstart",  onTS);
      wrp.removeEventListener("touchmove",   onTM);
      wrp.removeEventListener("touchend",    onTE);
      wrp.removeEventListener("touchcancel", onTE);
      wrp.removeEventListener("wheel",       onWheel);
    };
  }, [layer, drawOv]);

  useEffect(() => { if(layer==="overview") drawOv(); }, [fieldRects, selOvId, ovZoom, ovPan, layer, fields, outlines, drawOv]);

  // ── Overview pointer events ───────────────────────────────────
  function ovGetP(e) {
    if (!ovCanvasRef.current) return { x: 0, y: 0 };
    const r=ovCanvasRef.current.getBoundingClientRect();
    const cl=e.touches?e.touches[0]:e;
    return { x:cl.clientX-r.left, y:cl.clientY-r.top };
  }
  function ovHitField(px,py) {
    const zoom=ovZoomRef.current, pan=ovPanRef.current, rects=fieldRectsRef.current;
    const sortedF = [...fields].sort((a,b)=>a.reading.localeCompare(b.reading,"ja"));
    for (let i=sortedF.length-1;i>=0;i--) {
      const f=sortedF[i], rawR=rects[f.id];
      const r = rawR || { x: 60+(i%3)*180, y: 60+Math.floor(i/3)*130, w:160, h:100, rot:0 };
      if(!r) continue;
      const tx=r.x*zoom+pan.x, ty=r.y*zoom+pan.y, tw=r.w*zoom, th=r.h*zoom;
      // simple AABB (ignore rotation for hit test)
      if (px>=tx&&px<=tx+tw&&py>=ty&&py<=ty+th) return f.id;
    }
    return null;
  }

  function ovOnDown(e) {
    const p=ovGetP(e);
    const st=ovSt.current;
    st.downP={...p}; st.downTime=Date.now();

    if (e.touches?.length===2) {
      st.pinch0=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      st.pinchZoom0=ovZoomRef.current;
      return;
    }
    const fid=ovHitField(p.x,p.y);
    if (fid) {
      setSelOvId(fid); selOvRef.current=fid;
      const rawR=fieldRectsRef.current[fid];
      const idx=[...fields].sort((a,b)=>a.reading.localeCompare(b.reading,"ja")).findIndex(f=>f.id===fid);
      const r = rawR || { x:60+(idx%3)*180, y:60+Math.floor(idx/3)*130, w:160, h:100, rot:0 };
      if (!rawR) setFieldRects(prev=>({...prev,[fid]:r}));
      st.drag={ fid, ox:r.x, oy:r.y, px:p.x, py:p.y };
      st.hasMoved=false;
    } else {
      setSelOvId(null); selOvRef.current=null;
      st.panning=true; st.panStart={x:p.x-ovPanRef.current.x, y:p.y-ovPanRef.current.y};
    }
  }
  function ovOnMove(e) {
    const p=ovGetP(e);
    const st=ovSt.current;

    if (e.touches?.length===2 && st.pinch0) {
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      setOvZoom(z=>{ const nz=Math.min(4,Math.max(0.3,st.pinchZoom0*(d/st.pinch0))); return nz; });
      return;
    }
    if (st.drag) {
      const dx=p.x-st.drag.px, dy=p.y-st.drag.py;
      if (Math.abs(dx)>4||Math.abs(dy)>4) st.hasMoved=true;
      if (st.hasMoved) {
        const zoom=ovZoomRef.current;
        const nx=st.drag.ox+dx/zoom, ny=st.drag.oy+dy/zoom;
        setFieldRects(prev=>({...prev,[st.drag.fid]:{...prev[st.drag.fid],x:Math.max(0,nx),y:Math.max(0,ny)}}));
      }
    } else if (st.panning) {
      setOvPan({x:p.x-st.panStart.x, y:p.y-st.panStart.y});
    }
  }
  function ovOnUp(e) {
    const st=ovSt.current;
    const elapsed=Date.now()-st.downTime;
    // double-tap: go to design
    if (!st.hasMoved && elapsed < 350 && st.drag) {
      if (st.tapTimer) {
        clearTimeout(st.tapTimer);
        st.tapTimer=null;
        setActiveId(st.drag.fid);
        setLayer("design");
        st.drag=null; st.panning=false; st.hasMoved=false;
        return;
      }
      st.tapTimer=setTimeout(()=>{ st.tapTimer=null; },350);
    }
    st.drag=null; st.panning=false; st.hasMoved=false; st.pinch0=null;
  }
  // assign to refs so useEffect can call them
  ovDownRef.current = ovOnDown;
  ovMoveRef.current = ovOnMove;
  ovUpRef.current   = ovOnUp;

  // ── Design draw ───────────────────────────────────────────────
  const drawDs = useCallback(() => {
    const cv=dsCanvasRef.current, wrp=dsWrapRef.current;
    if(!cv||!wrp) return;
    const W=cv.width,H=cv.height;
    const ctx=cv.getContext("2d");
    const ppm=dsZoomRef.current*BASE_PX_PER_M;
    const gp=ppm;

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#c8b878"; ctx.fillRect(0,0,W,H);

    // grid
    ctx.strokeStyle="rgba(100,80,40,0.18)"; ctx.lineWidth=0.5;
    for(let x=0;x<W;x+=gp){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=gp){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // labels
    const fs=Math.max(8,Math.min(11,gp*0.85));
    ctx.fillStyle="#806040";ctx.font=`${fs}px sans-serif`;
    ctx.textAlign="center";ctx.textBaseline="top";
    for(let m=0;m*gp<W;m+=5)ctx.fillText(m+"m",m*gp+gp*2.5,2);
    ctx.textAlign="left";ctx.textBaseline="middle";
    for(let m=5;m*gp<H;m+=5)ctx.fillText(m+"m",2,m*gp);

    // outline
    const outline=curOutRef.current;
    const mode=dsModeRef.current;
    const svtx=selVtxRef.current;
    if(outline.length>=3){
      ctx.beginPath();ctx.moveTo(outline[0].x,outline[0].y);
      outline.slice(1).forEach(v=>ctx.lineTo(v.x,v.y));
      ctx.closePath();ctx.fillStyle="#ddd0a0";ctx.fill();
    }
    if(outline.length>=2){
      ctx.beginPath();ctx.moveTo(outline[0].x,outline[0].y);
      outline.slice(1).forEach(v=>ctx.lineTo(v.x,v.y));
      if(outline.length>=3)ctx.closePath();
      ctx.strokeStyle="#7a5a20";ctx.lineWidth=mode==="outline"?2.5:1.8;ctx.stroke();
    }
    if(mode==="outline"){
      const st2=dsSt.current;
      if(st2.ghostX!=null&&outline.length>=1){
        const last=outline[outline.length-1];
        ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(st2.ghostX,st2.ghostY);
        ctx.strokeStyle="rgba(100,60,10,0.4)";ctx.lineWidth=1;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);
      }
      outline.forEach((v,i)=>{
        const isSel=svtx===i;
        ctx.beginPath();ctx.arc(v.x,v.y,isSel?8:6,0,Math.PI*2);
        ctx.fillStyle=isSel?"#2d6a2d":"#fff";ctx.strokeStyle="#2d6a2d";ctx.lineWidth=2;
        ctx.fill();ctx.stroke();
        ctx.fillStyle=isSel?"#fff":"#2d6a2d";ctx.font="bold 9px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.fillText(i+1,v.x,v.y);
      });
    }

    // beds
    curBedsRef.current.forEach(b=>{
      const bw=bedPxW(b,ppm),bh=bedPxH(b,ppm);
      const sel=selBedRef.current===b.id;
      const c=gcrop(b.crop);
      if(sel){ctx.fillStyle="rgba(0,0,0,0.12)";ctx.fillRect(b.x+3,b.y+3,bw,bh);}
      ctx.fillStyle=hexA(c.col,0.78);ctx.fillRect(b.x,b.y,bw,bh);
      ctx.strokeStyle=hexA(c.col,0.35);ctx.lineWidth=1.5;
      const sw=Math.max(6,bh*0.13);
      for(let sx=b.x+sw;sx<b.x+bw-2;sx+=sw*2){ctx.beginPath();ctx.moveTo(sx,b.y+2);ctx.lineTo(sx,b.y+bh-2);ctx.stroke();}
      ctx.strokeStyle=sel?"#1a4a1a":hexA(c.col,0.9);ctx.lineWidth=sel?2.5:1.2;ctx.strokeRect(b.x,b.y,bw,bh);
      if(sel){ctx.strokeStyle="rgba(45,106,45,0.45)";ctx.lineWidth=1;ctx.setLineDash([4,3]);ctx.strokeRect(b.x-4,b.y-4,bw+8,bh+8);ctx.setLineDash([]);}
      const lfs=Math.max(8,Math.min(13,bh*0.28));
      ctx.font=`bold ${lfs}px sans-serif`;ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";
      if(bw>24&&bh>16)ctx.fillText(c.e+" "+(b.label||c.lbl),b.x+bw/2,b.y+bh/2,bw-6);
      ctx.font=`${Math.max(7,lfs*0.75)}px sans-serif`;ctx.fillStyle="rgba(255,255,255,0.8)";
      const wM=b.rotated?b.hM:b.wM,hM=b.rotated?b.wM:b.hM;
      if(bh>24)ctx.fillText(`${wM}×${hM}m`,b.x+bw/2,b.y+bh-7,bw-4);
      if(b.plants&&bh>38)ctx.fillText(b.plants+"株",b.x+bw/2,b.y+7,bw-4);
    });

    // placing ghost
    const pt=placRef.current,st=dsSt.current;
    if(pt&&st.ghostX!=null){
      const bw=bedPxW(pt,ppm),bh=bedPxH(pt,ppm);
      ctx.fillStyle="rgba(74,143,74,0.3)";ctx.strokeStyle="#2d6a2d";ctx.lineWidth=2;ctx.setLineDash([5,4]);
      ctx.fillRect(st.ghostX,st.ghostY,bw,bh);ctx.strokeRect(st.ghostX,st.ghostY,bw,bh);ctx.setLineDash([]);
      ctx.fillStyle="#2d6a2d";ctx.font="11px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText(`${pt.rotated?pt.hM:pt.wM}×${pt.rotated?pt.wM:pt.hM}m`,st.ghostX+bw/2,st.ghostY+bh/2);
    }
  }, [activeId]);

  useEffect(()=>{
    if(layer!=="design") return;
    const cv=dsCanvasRef.current,wrp=dsWrapRef.current;
    if(!cv||!wrp) return;
    const ro=new ResizeObserver(()=>{cv.width=Math.max(2000,wrp.clientWidth);cv.height=wrp.clientHeight;drawDs();});
    ro.observe(wrp);
    cv.width=Math.max(2000,wrp.clientWidth);cv.height=wrp.clientHeight;
    drawDs();

    // native touch listeners (passive:false)
    const onTS = e => { e.preventDefault(); dsDownRef.current?.(e); };
    const onTM = e => { e.preventDefault(); dsMoveRef.current?.(e); };
    const onTE = e => { e.preventDefault(); dsUpRef.current?.(e); };
    wrp.addEventListener("touchstart",  onTS, { passive: false });
    wrp.addEventListener("touchmove",   onTM, { passive: false });
    wrp.addEventListener("touchend",    onTE, { passive: false });
    wrp.addEventListener("touchcancel", onTE, { passive: false });

    // wheel zoom for trackpad pinch / mouse wheel
    const onWheel = e => {
      e.preventDefault();
      const factor = (e.deltaY||e.deltaX) > 0 ? 0.92 : 1.08;
      setDsZoom(z => Math.min(12, Math.max(1, z * factor)));
    };
    wrp.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      ro.disconnect();
      wrp.removeEventListener("touchstart",  onTS);
      wrp.removeEventListener("touchmove",   onTM);
      wrp.removeEventListener("touchend",    onTE);
      wrp.removeEventListener("touchcancel", onTE);
      wrp.removeEventListener("wheel",       onWheel);
    };
  },[layer,drawDs]);

  useEffect(()=>{ if(layer==="design")drawDs(); },[curBeds,curOutline,selBedId,selVtx,placingTpl,dsZoom,dsMode,layer,drawDs]);

  // ── Design pointer events ─────────────────────────────────────
  function dsGetP(e){
    const r=dsCanvasRef.current.getBoundingClientRect();
    const cl=e.touches?e.touches[0]:e;
    return{x:cl.clientX-r.left+(dsWrapRef.current?.scrollLeft||0),y:cl.clientY-r.top};
  }
  function dsSnap(p){const gp=dsZoomRef.current*BASE_PX_PER_M;return{x:snapV(p.x,gp),y:snapV(p.y,gp)};}
  function dsHitVtx(px,py){return curOutRef.current.findIndex(v=>Math.hypot(v.x-px,v.y-py)<12);}
  function dsHitBed(px,py){
    const ppm=dsZoomRef.current*BASE_PX_PER_M;
    for(let i=curBedsRef.current.length-1;i>=0;i--){
      const b=curBedsRef.current[i];
      if(px>=b.x&&px<=b.x+bedPxW(b,ppm)&&py>=b.y&&py<=b.y+bedPxH(b,ppm))return b;
    }
    return null;
  }
  function dsOnDown(e){
    const raw=dsGetP(e),p=dsSnap(raw);
    const st=dsSt.current,mode=dsModeRef.current;
    if(mode==="outline"){
      const vi=dsHitVtx(raw.x,raw.y);
      if(vi>=0){st.vtxDrag=vi;setSelVtx(vi);selVtxRef.current=vi;return;}
      setCurOut(prev=>[...prev,p]);st.ghostX=null;st.ghostY=null;return;
    }
    const pt=placRef.current;
    if(pt){
      const ppm=dsZoomRef.current*BASE_PX_PER_M;
      const bw=bedPxW(pt,ppm),bh=bedPxH(pt,ppm);
      const cand={x:p.x,y:p.y,w:bw,h:bh};
      const hit=curBedsRef.current.some(b=>rectsOverlap(cand,{x:b.x,y:b.y,w:bedPxW(b,ppm),h:bedPxH(b,ppm)}));
      if(!hit){
        const nb={id:Date.now()+Math.random(),wM:pt.wM,hM:pt.hM,x:p.x,y:p.y,rotated:pt.rotated||false,crop:"onion",label:"",plants:"",memo:""};
        setCurBeds(prev=>[...prev,nb]);setSelBedId(nb.id);selBedRef.current=nb.id;
      }
      st.ghostX=null;st.ghostY=null;return;
    }
    const b=dsHitBed(raw.x,raw.y);
    if(b){setSelBedId(b.id);selBedRef.current=b.id;st.drag={id:b.id,ox:b.x,oy:b.y,px:raw.x,py:raw.y};st.hasMoved=false;}
    else{setSelBedId(null);selBedRef.current=null;}
    drawDs();
  }
  function dsOnMove(e){
    const raw=dsGetP(e),p=dsSnap(raw);
    const gp=dsZoomRef.current*BASE_PX_PER_M;
    const st=dsSt.current,mode=dsModeRef.current;
    if(mode==="outline"){
      if(st.vtxDrag!=null){setCurOut(prev=>prev.map((v,i)=>i===st.vtxDrag?p:v));drawDs();return;}
      st.ghostX=p.x;st.ghostY=p.y;drawDs();return;
    }
    if(placRef.current){st.ghostX=p.x;st.ghostY=p.y;drawDs();return;}
    if(st.drag){
      const dx=raw.x-st.drag.px,dy=raw.y-st.drag.py;
      if(Math.abs(dx)>3||Math.abs(dy)>3)st.hasMoved=true;
      if(st.hasMoved){
        const ppm=gp,nx=snapV(st.drag.ox+dx,gp),ny=snapV(st.drag.oy+dy,gp);
        setCurBeds(prev=>prev.map(b=>{
          if(b.id!==st.drag.id)return b;
          const cand={x:nx,y:Math.max(0,ny),w:bedPxW(b,ppm),h:bedPxH(b,ppm)};
          const hit=prev.some(ob=>ob.id!==b.id&&rectsOverlap(cand,{x:ob.x,y:ob.y,w:bedPxW(ob,ppm),h:bedPxH(ob,ppm)}));
          return hit?b:{...b,x:Math.max(0,nx),y:Math.max(0,ny)};
        }));
      }
    }
  }
  function dsOnUp(e){
    const st=dsSt.current;
    st.vtxDrag=null;
    if(st.drag&&!st.hasMoved){const b=curBedsRef.current.find(b=>b.id===st.drag.id);if(b)setEditBed({...b});}
    st.drag=null;st.hasMoved=false;drawDs();
  }
  const lastPinchRef=useRef(null);
  function dsOnTouchStart(e){
    if(e.touches.length===2){lastPinchRef.current=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);}
    else{e.preventDefault();dsOnDown(e);}
  }
  function dsOnTouchMove(e){
    if(e.touches.length===2&&lastPinchRef.current){
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      setDsZoom(z=>Math.min(12,Math.max(1,z*(d/lastPinchRef.current))));lastPinchRef.current=d;
    }else{e.preventDefault();dsOnMove(e);}
  }
  function dsOnTouchEnd(e){lastPinchRef.current=null;dsOnUp(e);}
  // assign to refs so useEffect can call them
  dsDownRef.current = dsOnTouchStart;
  dsMoveRef.current = dsOnTouchMove;
  dsUpRef.current   = dsOnTouchEnd;

  // bed / outline actions
  const rotateBed  = ()=>{const id=selBedRef.current;if(!id)return;setCurBeds(prev=>prev.map(b=>b.id===id?{...b,rotated:!b.rotated}:b));};
  const deleteBed  = ()=>{const id=selBedRef.current;if(!id)return;setCurBeds(prev=>prev.filter(b=>b.id!==id));setSelBedId(null);selBedRef.current=null;};
  const saveEdit   = upd=>{setCurBeds(prev=>prev.map(b=>b.id===upd.id?{...b,...upd}:b));setEditBed(null);};
  const undoVtx    = ()=>{ setCurOut(prev=>prev.slice(0,-1)); setSelVtx(null); };
  const clearOut   = ()=>{ setCurOut([]); setSelVtx(null); };
  const deleteVtx  = ()=>{ if(selVtx==null)return; setCurOut(prev=>prev.filter((_,i)=>i!==selVtx)); setSelVtx(null); };

  const selBed   = curBeds.find(b=>b.id===selBedId);
  const activeF  = fields.find(f=>f.id===activeId);
  const pxPerM   = BASE_PX_PER_M * dsZoom;

  // rotate field rect on overview
  function rotateField(fid) {
    setFieldRects(prev=>({...prev,[fid]:{...prev[fid],rot:((prev[fid]?.rot||0)+15)%360}}));
  }

  // ╔══════ OVERVIEW VIEW ══════════════════════════════════════════╗
  if (layer === "overview") {
    const sortedF=[...fields].sort((a,b)=>a.reading.localeCompare(b.reading,"ja"));
    const selF = fields.find(f=>f.id===selOvId);
    return (
      <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 72px)"}}>
        {/* header */}
        <div style={{background:"linear-gradient(150deg,#1a4a1a,#2d6a2d,#4a8f4a)",color:"#fff",padding:"10px 14px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontWeight:700,fontSize:15}}>🗺 圃場マップ</span>
            <button onClick={()=>setShowAddField(true)} style={{background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.4)",color:"#fff",borderRadius:12,padding:"4px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>＋ 畑を追加</button>
          </div>
          <div style={{fontSize:11,opacity:0.8}}>ドラッグで移動 ｜ ピンチでズーム ｜ ダブルタップで詳細へ</div>
        </div>

        {/* selected field action bar */}
        {selF&&(
          <div style={{background:"#fff",borderBottom:`1px solid ${COLORS.border}`,padding:"8px 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <div style={{width:10,height:10,borderRadius:2,background:selF.color,flexShrink:0}}/>
            <span style={{fontWeight:700,fontSize:13,color:COLORS.text,flex:1}}>{selF.name}</span>
            <button onClick={()=>rotateField(selOvId)} style={{background:COLORS.bgSecondary,border:`1px solid ${COLORS.border}`,borderRadius:8,padding:"5px 10px",fontSize:11,cursor:"pointer",color:COLORS.primary}}>🔄 回転</button>
            <button onClick={()=>{setActiveId(selOvId);setLayer("design");}} style={{background:COLORS.primary,border:"none",borderRadius:8,padding:"5px 12px",fontSize:11,cursor:"pointer",color:"#fff",fontWeight:600}}>設計マップへ →</button>
          </div>
        )}

        {/* canvas */}
        <div ref={ovWrapRef} style={{flex:1,position:"relative",overflow:"hidden",cursor:selOvId?"grab":"default"}}
          onMouseDown={ovOnDown} onMouseMove={ovOnMove} onMouseUp={ovOnUp} onMouseLeave={ovOnUp}
        >
          <canvas ref={ovCanvasRef} style={{display:"block",touchAction:"none"}}/>
        </div>

        {/* zoom controls */}
        <div style={{background:"#fff",borderTop:`1px solid ${COLORS.border}`,padding:"6px 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <span style={{fontSize:11,color:COLORS.textMuted}}>🔍</span>
          <input type="range" min="0.3" max="4" step="0.05" value={ovZoom} onChange={e=>setOvZoom(+e.target.value)} style={{flex:1,accentColor:"#7ab648",height:3}}/>
          <span style={{fontSize:11,color:COLORS.textMuted,minWidth:28}}>{ovZoom.toFixed(1)}×</span>
          <button onClick={()=>{setOvZoom(1);setOvPan({x:0,y:0});}} style={{background:COLORS.bgSecondary,border:`1px solid ${COLORS.border}`,borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer",color:COLORS.textMuted}}>リセット</button>
        </div>

        {showAddField&&<AddFieldModal fields={fields} setFields={updater=>{
          // AddFieldModal calls setFields(prev=>[...prev, newField])
          const newFields = typeof updater === "function" ? updater(fields) : updater;
          const newF = newFields.find(nf => !fields.some(f => f.id === nf.id));
          if (newF) {
            setFieldRects(prev => {
              const vals = Object.values(prev);
              const maxY = vals.length ? Math.max(...vals.map(r => r.y + r.h)) : 60;
              const usedXs = vals.filter(r => r.y + r.h >= maxY - 10).map(r => r.x);
              let cx = 60;
              while (usedXs.includes(cx)) cx += 180;
              return { ...prev, [newF.id]: { x: cx, y: maxY + 20, w: 160, h: 100, rot: 0 } };
            });
          }
          setFields(newFields);
        }} onClose={()=>setShowAddField(false)}/>}
      </div>
    );
  }

  // ╔══════ DESIGN VIEW ════════════════════════════════════════════╗
  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 72px)",background:"#f4f8f0"}}>
      {/* header */}
      <div style={{background:"linear-gradient(150deg,#1a4a1a,#2d6a2d,#4a8f4a)",color:"#fff",padding:"10px 14px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <button onClick={()=>{setLayer("overview");setPlacingTpl(null);setSelBedId(null);setSelVtx(null);}} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:8,padding:"4px 10px",fontSize:12,cursor:"pointer"}}>‹ 俯瞰</button>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
            {activeF&&<div style={{width:10,height:10,borderRadius:2,background:activeF.color,flexShrink:0}}/>}
            <span style={{fontWeight:700,fontSize:14}}>{activeF?.name||"設計マップ"}</span>
            {activeF&&<span style={{fontSize:10,opacity:0.75}}>{activeF.area}</span>}
          </div>
          <span style={{fontSize:10,opacity:0.8}}>1m={Math.round(pxPerM)}px</span>
        </div>
        {/* mode tabs */}
        <div style={{display:"flex",gap:4,marginBottom:8}}>
          {[["outline","🖊 外形"],["bed","🌿 畝"]].map(([m,lbl])=>(
            <button key={m} onClick={()=>{setDsMode(m);setPlacingTpl(null);setSelBedId(null);setSelVtx(null);}}
              style={{background:dsMode===m?"rgba(255,255,255,.9)":"rgba(255,255,255,.18)",border:"1px solid rgba(255,255,255,.3)",color:dsMode===m?"#1a4a1a":"#fff",borderRadius:14,padding:"5px 14px",fontSize:12,cursor:"pointer",fontWeight:dsMode===m?700:400}}>
              {lbl}
            </button>
          ))}
          <div style={{flex:1,display:"flex",alignItems:"center",gap:6,paddingLeft:8}}>
            <span style={{fontSize:10,opacity:0.8}}>🔍</span>
            <input type="range" min="1" max="12" step="0.5" value={dsZoom} onChange={e=>setDsZoom(+e.target.value)} style={{flex:1,accentColor:"#a8d06b",height:3}}/>
            <span style={{fontSize:10,opacity:0.8,minWidth:26}}>{dsZoom.toFixed(1)}×</span>
          </div>
        </div>
        {/* toolbars */}
        {dsMode==="outline"&&(
          <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
            <button onClick={undoVtx} style={{background:"rgba(255,255,255,.18)",border:"1px solid rgba(255,255,255,.3)",color:"#fff",borderRadius:10,padding:"4px 10px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>↩ 直前を削除</button>
            {selVtx!=null&&<button onClick={deleteVtx} style={{background:"rgba(200,60,60,.6)",border:"none",color:"#fff",borderRadius:10,padding:"4px 10px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>🗑 頂点{selVtx+1}</button>}
            <button onClick={clearOut} style={{background:"rgba(200,60,60,.4)",border:"none",color:"#fff",borderRadius:10,padding:"4px 10px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>✕ リセット</button>
            <span style={{fontSize:10,opacity:0.75,alignSelf:"center",whiteSpace:"nowrap"}}>{curOutline.length}頂点</span>
          </div>
        )}
        {dsMode==="bed"&&(
          <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
            {BED_TEMPLATES.map(t=>{
              const active=placingTpl?.id===t.id;
              return <button key={t.id} onClick={()=>setPlacingTpl(active?null:{...t,rotated:false})}
                style={{background:active?"rgba(255,255,255,.9)":"rgba(255,255,255,.18)",border:"1px solid rgba(255,255,255,.35)",color:active?"#1a4a1a":"#fff",borderRadius:14,padding:"4px 10px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap",fontWeight:active?700:400,flexShrink:0}}>
                {active?"✕ キャンセル":"＋ "+t.label}
              </button>;
            })}
          </div>
        )}
      </div>
      {/* hint */}
      {dsMode==="outline"&&<div style={{background:"#fffbe6",borderBottom:"1px solid #f0c040",padding:"5px 14px",fontSize:11,color:"#7a5a00",flexShrink:0}}>📐 タップで頂点追加。頂点ドラッグで移動。3点以上で外形完成。</div>}
      {dsMode==="bed"&&placingTpl&&<div style={{background:"#fffbe6",borderBottom:"1px solid #f0c040",padding:"5px 14px",fontSize:11,color:"#7a5a00",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <span>📌 タップして <strong>{placingTpl.label}</strong> を配置</span>
        <button onClick={()=>setPlacingTpl(p=>({...p,rotated:!p.rotated}))} style={{marginLeft:"auto",background:"#f0c040",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer",fontWeight:600}}>🔄 回転</button>
      </div>}

      {/* canvas + panel */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div ref={dsWrapRef} style={{flex:1,overflowX:"auto",overflowY:"auto",cursor:dsMode==="outline"?"crosshair":"default"}}>
          <canvas ref={dsCanvasRef} style={{display:"block",touchAction:"none"}}
            onMouseDown={dsOnDown} onMouseMove={dsOnMove} onMouseUp={dsOnUp} onMouseLeave={dsOnUp}/>
        </div>
        {/* bed panel */}
        {dsMode==="bed"&&selBed&&(
          <div style={{width:156,background:"#fff",borderLeft:`1px solid ${COLORS.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",padding:"8px 10px",borderBottom:`1px solid ${COLORS.border}`}}>
              <span style={{fontWeight:700,fontSize:12,color:COLORS.text,flex:1}}>畝を編集</span>
              <button onClick={()=>setSelBedId(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:COLORS.textLight}}>✕</button>
            </div>
            <div style={{padding:10,flex:1,overflowY:"auto"}}>
              <div style={{textAlign:"center",fontSize:32,marginBottom:4}}>{gcrop(selBed.crop).e}</div>
              <div style={{fontSize:10,color:COLORS.textMuted,textAlign:"center",marginBottom:8}}>{selBed.rotated?selBed.hM:selBed.wM}m × {selBed.rotated?selBed.wM:selBed.hM}m</div>
              <button onClick={rotateBed} style={{width:"100%",background:COLORS.bgSecondary,border:`1px solid ${COLORS.border}`,borderRadius:7,padding:"7px 0",fontSize:12,cursor:"pointer",fontWeight:600,color:COLORS.primary,marginBottom:6}}>🔄 回転</button>
              <button onClick={()=>setEditBed({...selBed})} style={{width:"100%",background:COLORS.primary,border:"none",borderRadius:7,padding:"7px 0",fontSize:12,cursor:"pointer",fontWeight:600,color:"#fff",marginBottom:6}}>✏️ 詳細編集</button>
              <button onClick={deleteBed} style={{width:"100%",background:COLORS.danger,border:"none",borderRadius:7,padding:"7px 0",fontSize:12,cursor:"pointer",fontWeight:600,color:"#fff"}}>🗑 削除</button>
              <div style={{marginTop:10,background:COLORS.bgSecondary,borderRadius:7,padding:"8px 10px"}}>
                <div style={{fontSize:10,color:COLORS.textMuted}}>作物</div>
                <div style={{fontSize:13,fontWeight:700,color:COLORS.text}}>{gcrop(selBed.crop).lbl}</div>
                {selBed.plants&&<><div style={{fontSize:10,color:COLORS.textMuted,marginTop:4}}>株数</div><div style={{fontSize:12,fontWeight:600,color:COLORS.text}}>{selBed.plants}株</div></>}
                {selBed.memo&&<><div style={{fontSize:10,color:COLORS.textMuted,marginTop:4}}>メモ</div><div style={{fontSize:11,color:COLORS.text}}>{selBed.memo}</div></>}
              </div>
            </div>
          </div>
        )}
        {/* vertex panel */}
        {dsMode==="outline"&&selVtx!=null&&curOutline[selVtx]&&(
          <div style={{width:156,background:"#fff",borderLeft:`1px solid ${COLORS.border}`,padding:12,flexShrink:0}}>
            <div style={{fontWeight:700,fontSize:13,color:COLORS.text,marginBottom:8}}>頂点 {selVtx+1}</div>
            <div style={{fontSize:11,color:COLORS.textMuted,marginBottom:4}}>X: {Math.round(curOutline[selVtx].x/pxPerM*10)/10}m</div>
            <div style={{fontSize:11,color:COLORS.textMuted,marginBottom:12}}>Y: {Math.round(curOutline[selVtx].y/pxPerM*10)/10}m</div>
            <button onClick={deleteVtx} style={{background:COLORS.danger,border:"none",borderRadius:7,padding:"7px 0",fontSize:12,cursor:"pointer",fontWeight:600,color:"#fff",width:"100%"}}>🗑 削除</button>
            <button onClick={()=>setSelVtx(null)} style={{background:"transparent",border:`1px solid ${COLORS.border}`,borderRadius:7,padding:"7px 0",fontSize:12,cursor:"pointer",color:COLORS.textMuted,marginTop:6,width:"100%"}}>閉じる</button>
          </div>
        )}
      </div>
      {/* footer */}
      <div style={{background:"#fff",borderTop:`1px solid ${COLORS.border}`,padding:"6px 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0,overflowX:"auto"}}>
        <span style={{fontSize:11,color:COLORS.textMuted,whiteSpace:"nowrap",flexShrink:0}}>
          {dsMode==="outline"?`外形: ${curOutline.length}頂点`:`畝: ${curBeds.length}本`}
        </span>
        {dsMode==="bed"&&Object.entries(curBeds.reduce((acc,b)=>{acc[b.crop]=(acc[b.crop]||0)+1;return acc;},{})).map(([cid,cnt])=>{
          const c=gcrop(cid);
          return <span key={cid} style={{fontSize:11,background:hexA(c.col,0.15),color:c.col,border:`1px solid ${hexA(c.col,0.4)}`,borderRadius:10,padding:"2px 8px",whiteSpace:"nowrap",flexShrink:0}}>{c.e} {cnt}本</span>;
        })}
        {dsMode==="bed"&&curBeds.length===0&&<span style={{fontSize:11,color:COLORS.textLight}}>パレットで畝サイズを選びタップで配置</span>}
      </div>
      {editBed&&<BedEditModal bed={editBed} onSave={saveEdit} onClose={()=>setEditBed(null)}/>}
    </div>
  );
}

function BedEditModal({ bed, onSave, onClose }) {
  const [data, setData] = useState({ ...bed });
  const up = (k, v) => setData(d => ({ ...d, [k]: v }));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxWidth: 480, margin: "0 auto", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, flex: 1 }}>✏️ 畝の詳細編集</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textLight }}>✕</button>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.primary, marginBottom: 6 }}>作物を選択</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, marginBottom: 14 }}>
          {CROP_DEFS.map(c => (
            <div key={c.id} onClick={() => up("crop", c.id)} style={{ border: `1px solid ${data.crop === c.id ? COLORS.primary : COLORS.border}`, borderRadius: 8, padding: "6px 4px", textAlign: "center", cursor: "pointer", background: data.crop === c.id ? COLORS.bgSecondary : "#fff", fontSize: 10 }}>
              <div style={{ fontSize: 22 }}>{c.e}</div>
              <div style={{ fontWeight: data.crop === c.id ? 700 : 400 }}>{c.lbl}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {[["ラベル", "label", "text", "任意の名前"], ["株数", "plants", "number", "例: 200"], ].map(([lbl, key, type, ph]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: COLORS.textMuted, width: 46 }}>{lbl}</span>
              <input value={data[key] || ""} onChange={e => up(key, e.target.value)} placeholder={ph} type={type} style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "8px 10px", fontSize: 13 }} />
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 12, color: COLORS.textMuted, width: 46, paddingTop: 8 }}>メモ</span>
            <textarea value={data.memo || ""} onChange={e => up("memo", e.target.value)} placeholder="管理メモ・品種など" rows={2} style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "8px 10px", fontSize: 13, resize: "none" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, border: `1px solid ${COLORS.border}`, background: "transparent", borderRadius: 8, padding: 11, fontSize: 14, cursor: "pointer" }}>キャンセル</button>
          <button onClick={() => onSave(data)} style={{ flex: 2, background: COLORS.primary, border: "none", borderRadius: 8, padding: 11, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>保存</button>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
//  マニュアル（辞書）タブ — フォルダ型ナレッジベース
// ══════════════════════════════════════════════════════════════════

const MANUAL_INITIAL_FOLDERS = [
  { id: "f1", name: "栽培マニュアル", parentId: null, icon: "🌱" },
  { id: "f2", name: "作業手順",       parentId: null, icon: "📋" },
  { id: "f3", name: "トラブル対応",   parentId: null, icon: "🆘" },
  { id: "f1-1", name: "トマト",   parentId: "f1", icon: "🍅" },
  { id: "f1-2", name: "ナス",     parentId: "f1", icon: "🍆" },
  { id: "f1-3", name: "玉ねぎ",   parentId: "f1", icon: "🧅" },
  { id: "f2-1", name: "定植",     parentId: "f2", icon: "🪴" },
  { id: "f2-2", name: "水やり",   parentId: "f2", icon: "💧" },
  { id: "f2-3", name: "収穫",     parentId: "f2", icon: "🧺" },
  { id: "f3-1", name: "病気",     parentId: "f3", icon: "🦠" },
  { id: "f3-2", name: "害虫",     parentId: "f3", icon: "🐛" },
];

const MANUAL_INITIAL_PAGES = [
  {
    id: "p1", title: "トマト栽培の基本", folderId: "f1-1",
    content: "【品種選定】\n小諸の寒冷地では、早生・中生品種を選ぶ。\n\n【定植時期】\n5月中旬〜下旬（遅霜が落ち着いてから）。\n\n【株間・畝間】\n株間50cm、畝間80cm。不耕起栽培では通路に籾殻を敷く。\n\n【仕立て方】\n1本仕立てを基本とし、自然農では支柱なしの自然仕立ても可。\n\n【注意点】\n低温によるうどん粉病・疫病に注意。風通しを確保する。",
    images: [], createdBy: "admin", updatedAt: "2024-04-01",
  },
  {
    id: "p2", title: "玉ねぎ垂直仕立て手順", folderId: "f1-3",
    content: "【垂直仕立てとは】\n苗を垂直に立てて植える小諸独自の技術。分けつを促し大玉になる。\n\n【手順】\n① 苗の根元を切り揃え、垂直に立てて植える\n② 株間15cm、条間15cm\n③ 通路に籾殻堆肥を敷く\n④ 不織布でトンネル被覆（3月定植の場合）\n\n【注意：低温おだち】\n3℃以下が続くと花茎が立つ（おだつ）。3月以降の定植で回避。",
    images: [], createdBy: "admin", updatedAt: "2024-04-10",
  },
  {
    id: "p3", title: "定植の基本手順", folderId: "f2-1",
    content: "【事前準備】\n不耕起栽培では耕さない。前作の残渣を刈って畝面を整える。\n\n【定植の流れ】\n① 畝に定植穴を開ける（指や棒で）\n② 苗を丁寧に入れ、根を広げる\n③ 土を軽く押さえる（強く押さない）\n④ 水をたっぷり与える\n⑤ 草マルチを株元に敷く\n\n【ポイント】\n根を傷めない。自然農では根が土を感じながら根付く力を信じる。",
    images: [], createdBy: "admin", updatedAt: "2024-03-20",
  },
  {
    id: "p4", title: "遅霜対策（小諸特有）", folderId: "f3-1",
    content: "【小諸の遅霜】\n標高600〜1000mの小諸では5月上旬まで遅霜の危険がある。\n\n【対策】\n・不織布でトンネル被覆\n・ビニールトンネル\n・定植時期を5月中旬以降にずらす\n\n【気温の目安】\n最低気温3℃以下 → 要注意\n最低気温0℃以下 → 必ず被覆\n\n【作業タイミング】\n夕方17時までに被覆。朝9時以降に外す（蒸れ防止）。",
    images: [], createdBy: "admin", updatedAt: "2024-04-05",
  },
];

function DictTab({ currentUser }) {
  const isAdmin = currentUser?.role === "admin";

  const [folders, setFolders] = useState([
    { id:"f1", name:"栽培マニュアル", parentId:null, icon:"🌱" },
    { id:"f2", name:"作業手順",       parentId:null, icon:"📋" },
    { id:"f3", name:"トラブル対応",   parentId:null, icon:"🆘" },
    { id:"f1-1", name:"トマト",  parentId:"f1", icon:"🍅" },
    { id:"f1-2", name:"玉ねぎ",  parentId:"f1", icon:"🧅" },
    { id:"f2-1", name:"定植",    parentId:"f2", icon:"🪴" },
    { id:"f2-2", name:"水やり",  parentId:"f2", icon:"💧" },
    { id:"f3-1", name:"病気",    parentId:"f3", icon:"🦠" },
    { id:"f3-2", name:"害虫",    parentId:"f3", icon:"🐛" },
  ]);
  const [pages, setPages] = useState([
    { id:"p1", title:"トマト栽培の基本", folderId:"f1-1", content:"【定植時期】\n5月中旬〜下旬。遅霜が落ち着いてから。\n\n【株間・畝間】\n株間50cm、畝間80cm。不耕起では通路に籾殻を敷く。\n\n【仕立て方】\n1本仕立て。自然農では支柱なし自然仕立ても可。", createdBy:"admin", updatedAt:"2024-04-01" },
    { id:"p2", title:"玉ねぎ垂直仕立て", folderId:"f1-2", content:"【垂直仕立てとは】\n苗を垂直に立てて植える小諸独自技術。\n\n【手順】\n① 株間15cm、条間15cmで垂直に植える\n② 通路に籾殻堆肥を敷く\n③ 3月定植の場合は不織布でトンネル被覆\n\n【注意：低温おだち】\n3℃以下が続くと花茎が立つ。3月以降の定植で回避。", createdBy:"admin", updatedAt:"2024-04-10" },
    { id:"p3", title:"定植の基本手順",   folderId:"f2-1", content:"① 畝に定植穴を開ける\n② 苗を丁寧に入れ根を広げる\n③ 土を軽く押さえる\n④ 水をたっぷり与える\n⑤ 草マルチを株元に敷く\n\n根を傷めないことが重要。", createdBy:"admin", updatedAt:"2024-03-20" },
    { id:"p4", title:"遅霜対策（小諸）", folderId:"f3-1", content:"【小諸の遅霜】\n5月上旬まで遅霜の危険あり。\n\n【対策】\n・不織布でトンネル被覆\n・ビニールトンネル\n・定植を5月中旬以降にずらす\n\n【気温の目安】\n0℃以下 → 必ず被覆", createdBy:"admin", updatedAt:"2024-04-05" },
  ]);

  const [path,          setPath]          = useState([]);
  const [openPage,      setOpenPage]      = useState(null);
  const [editMode,      setEditMode]      = useState(false);
  const [editDraft,     setEditDraft]     = useState(null);
  const [search,        setSearch]        = useState("");
  const [editPanel,     setEditPanel]     = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [newPageTitle,  setNewPageTitle]  = useState("");
  const [newPageFolder, setNewPageFolder] = useState(null);
  const [confirmState,  setConfirmState]  = useState(null);

  const curFolderId   = path.length > 0 ? path[path.length-1].id : null;
  const isSearching   = search.trim().length > 0;
  const searchResults = isSearching ? pages.filter(p => p.title.includes(search) || p.content.includes(search)) : [];
  const childFolders  = folders.filter(f => f.parentId === curFolderId);
  const childPages    = pages.filter(p => p.folderId === curFolderId);

  function askConfirm(msg, onOk) { setConfirmState({ msg, onOk }); }

  function savePage() {
    const now = new Date().toISOString().split("T")[0];
    const upd = { ...editDraft, updatedAt: now };
    setPages(prev => prev.map(p => p.id === upd.id ? upd : p));
    setOpenPage(upd); setEditMode(false);
  }

  function addPage() {
    if (!newPageTitle.trim()) return;
    const fid = newPageFolder ?? curFolderId;
    const np = { id:"p"+Date.now(), title:newPageTitle.trim(), folderId:fid, content:"", createdBy:currentUser?.id||"user", updatedAt:new Date().toISOString().split("T")[0] };
    setPages(prev => [...prev, np]);
    setNewPageTitle(""); setNewPageFolder(null);
    setEditDraft({...np}); setOpenPage(np); setEditMode(true); setEditPanel(false);
  }

  function addFolder() {
    if (!newFolderName.trim()) return;
    setFolders(prev => [...prev, { id:"f"+Date.now(), name:newFolderName.trim(), parentId:curFolderId, icon:newFolderIcon }]);
    setNewFolderName(""); setNewFolderIcon("📁");
  }

  function delPage(id) {
    askConfirm("このページを削除しますか？", () => {
      setPages(prev => prev.filter(p => p.id !== id));
      setOpenPage(null);
    });
  }

  function delFolder(id) {
    askConfirm("フォルダと中身を全て削除しますか？", () => {
      const getAllIds = (fid) => {
        const ids = [fid];
        folders.filter(f => f.parentId === fid).forEach(f => ids.push(...getAllIds(f.id)));
        return ids;
      };
      const allIds = getAllIds(id);
      setFolders(prev => prev.filter(f => !allIds.includes(f.id)));
      setPages(prev => prev.filter(p => !allIds.includes(p.folderId)));
    });
  }

  const INP  = { border:`1px solid ${COLORS.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, width:"100%", boxSizing:"border-box" };
  const CARD = { background:"#fff", border:`1px solid ${COLORS.border}`, borderRadius:12, padding:"13px 14px", marginBottom:8, cursor:"pointer", display:"flex", alignItems:"center", gap:12 };
  const ICON = { width:42, height:42, borderRadius:10, background:COLORS.bgSecondary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 };

  if (openPage && editMode && editDraft) return (
    <div style={{ minHeight:"100vh", background:COLORS.bg }}>
      <div style={{ background:`linear-gradient(150deg,${COLORS.primaryDark},${COLORS.primary})`, color:"#fff", padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={() => setEditMode(false)} style={{ background:"rgba(255,255,255,.2)", border:"none", color:"#fff", borderRadius:8, padding:"5px 10px", fontSize:12, cursor:"pointer" }}>✕ キャンセル</button>
        <span style={{ fontWeight:700, fontSize:14, flex:1 }}>✏️ 編集中</span>
        <button onClick={savePage} style={{ background:COLORS.accent, border:"none", color:"#fff", borderRadius:8, padding:"5px 14px", fontSize:13, cursor:"pointer", fontWeight:700 }}>保存</button>
      </div>
      <div style={{ padding:"16px 16px 80px" }}>
        <input value={editDraft.title} onChange={e => setEditDraft(d => ({...d, title:e.target.value}))} style={{ ...INP, fontSize:18, fontWeight:700, marginBottom:12 }} />
        <textarea value={editDraft.content} onChange={e => setEditDraft(d => ({...d, content:e.target.value}))} rows={18} style={{ ...INP, resize:"vertical", lineHeight:1.8 }} />
      </div>
    </div>
  );

  if (openPage) {
    const pg = pages.find(p => p.id === openPage.id) || openPage;
    return (
      <div style={{ minHeight:"100vh", background:COLORS.bg }}>
        <div style={{ background:`linear-gradient(150deg,${COLORS.primaryDark},${COLORS.primary})`, color:"#fff", padding:"12px 14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <button onClick={() => setOpenPage(null)} style={{ background:"rgba(255,255,255,.2)", border:"none", color:"#fff", borderRadius:8, padding:"5px 10px", fontSize:12, cursor:"pointer" }}>‹ 戻る</button>
            <span style={{ fontWeight:700, fontSize:14, flex:1 }}>{pg.title}</span>
            {isAdmin && <button onClick={() => { setEditDraft({...pg}); setEditMode(true); }} style={{ background:"rgba(255,255,255,.2)", border:"none", color:"#fff", borderRadius:8, padding:"5px 10px", fontSize:12, cursor:"pointer" }}>✏️ 編集</button>}
          </div>
          <div style={{ fontSize:10, opacity:.75 }}>更新: {pg.updatedAt} ・ 作成: {pg.createdBy}</div>
        </div>
        <div style={{ padding:"16px 16px 80px" }}>
          <h2 style={{ fontSize:20, fontWeight:700, color:COLORS.text, margin:"0 0 14px" }}>{pg.title}</h2>
          <div style={{ fontSize:15, color:COLORS.text, lineHeight:1.85, whiteSpace:"pre-wrap", background:"#fff", border:`1px solid ${COLORS.border}`, borderRadius:12, padding:16 }}>{pg.content||"本文なし"}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:COLORS.bg }}>
      <div style={{ background:`linear-gradient(150deg,${COLORS.primaryDark},${COLORS.primary})`, color:"#fff", padding:"12px 14px 10px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ fontWeight:700, fontSize:15 }}>📚 マニュアル</span>
          {isAdmin && (
            <button onClick={() => setEditPanel(true)} style={{ background:"rgba(255,255,255,.2)", border:"1px solid rgba(255,255,255,.35)", color:"#fff", borderRadius:10, padding:"5px 14px", fontSize:12, cursor:"pointer", fontWeight:600 }}>✏️ 編集</button>
          )}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="タイトル・本文を検索..."
          style={{ width:"100%", padding:"9px 14px", borderRadius:20, border:"none", fontSize:13, boxSizing:"border-box", background:"rgba(255,255,255,.9)", color:COLORS.text }} />
      </div>

      {!isSearching && (
        <div style={{ background:COLORS.bgCard, borderBottom:`1px solid ${COLORS.border}`, padding:"8px 14px", display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" }}>
          <button onClick={() => setPath([])} style={{ background:"none", border:"none", color:COLORS.primary, fontSize:12, cursor:"pointer", fontWeight:700 }}>🏠 ホーム</button>
          {path.map((p, i) => (
            <span key={p.id} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ color:COLORS.textLight, fontSize:11 }}>›</span>
              <button onClick={() => setPath(prev => prev.slice(0, i+1))}
                style={{ background:"none", border:"none", color:i===path.length-1?COLORS.text:COLORS.primary, fontSize:12, cursor:"pointer", fontWeight:i===path.length-1?700:400 }}>
                {p.icon} {p.name}
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ padding:"12px 14px 80px" }}>
        {isSearching ? (
          searchResults.length === 0
            ? <div style={{ textAlign:"center", padding:"32px 0", color:COLORS.textMuted }}><div style={{ fontSize:36, marginBottom:8 }}>🔍</div><div>「{search}」の検索結果はありません</div></div>
            : searchResults.map(p => (
              <div key={p.id} onClick={() => setOpenPage(p)} style={CARD}>
                <div style={{ ...ICON, background:"#fff9e6", fontSize:20 }}>📄</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:COLORS.text }}>{p.title}</div>
                  <div style={{ fontSize:11, color:COLORS.textMuted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.content.slice(0,50)}</div>
                  <div style={{ fontSize:10, color:COLORS.textLight, marginTop:2 }}>更新: {p.updatedAt}</div>
                </div>
                <span style={{ color:COLORS.textLight }}>›</span>
              </div>
            ))
        ) : (
          <>
            {childFolders.map(f => (
              <div key={f.id} onClick={() => setPath(prev => [...prev, {id:f.id, name:f.name, icon:f.icon}])} style={CARD}>
                <div style={ICON}>{f.icon||"📁"}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:COLORS.text }}>{f.name}</div>
                  <div style={{ fontSize:11, color:COLORS.textMuted, marginTop:2 }}>
                    {folders.filter(cf=>cf.parentId===f.id).length}フォルダ・{pages.filter(p=>p.folderId===f.id).length}ページ
                  </div>
                </div>
                <span style={{ color:COLORS.textLight, fontSize:18 }}>›</span>
              </div>
            ))}
            {childPages.map(p => (
              <div key={p.id} onClick={() => setOpenPage(p)} style={CARD}>
                <div style={{ ...ICON, background:"#fff9e6", fontSize:20 }}>📄</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:14, color:COLORS.text }}>{p.title}</div>
                  <div style={{ fontSize:11, color:COLORS.textMuted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.content.slice(0,40)}{p.content.length>40?"…":""}</div>
                  <div style={{ fontSize:10, color:COLORS.textLight, marginTop:2 }}>更新: {p.updatedAt}</div>
                </div>
                <span style={{ color:COLORS.textLight, fontSize:18 }}>›</span>
              </div>
            ))}
            {childFolders.length===0 && childPages.length===0 && (
              <div style={{ textAlign:"center", padding:"40px 0", color:COLORS.textMuted }}>
                <div style={{ fontSize:48, marginBottom:10 }}>📂</div>
                <div style={{ fontSize:14 }}>{curFolderId?"このフォルダは空です":"マニュアルがありません"}</div>
                {isAdmin && <div style={{ fontSize:12, marginTop:6, color:COLORS.textLight }}>右上の「✏️ 編集」から追加できます</div>}
              </div>
            )}
          </>
        )}
      </div>

      {editPanel && isAdmin && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:200, display:"flex", justifyContent:"flex-end" }}
          onClick={e => { if(e.target===e.currentTarget) setEditPanel(false); }}>
          <div style={{ width:300, background:"#fff", height:"100%", overflowY:"auto", boxShadow:"-4px 0 20px rgba(0,0,0,0.15)", display:"flex", flexDirection:"column" }}>
            <div style={{ background:`linear-gradient(150deg,${COLORS.primaryDark},${COLORS.primary})`, color:"#fff", padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <span style={{ fontWeight:700, fontSize:14 }}>✏️ 編集メニュー</span>
              <button onClick={() => setEditPanel(false)} style={{ background:"rgba(255,255,255,.2)", border:"none", color:"#fff", borderRadius:6, padding:"4px 10px", fontSize:12, cursor:"pointer" }}>閉じる</button>
            </div>
            <div style={{ padding:14, flex:1 }}>
              <div style={{ marginBottom:18 }}>
                <div style={{ fontWeight:700, fontSize:13, color:COLORS.text, marginBottom:10 }}>📄 ページを追加</div>
                <div style={{ marginBottom:8 }}>
                  <label style={{ fontSize:11, color:COLORS.textMuted, display:"block", marginBottom:4 }}>タイトル</label>
                  <input value={newPageTitle} onChange={e => setNewPageTitle(e.target.value)} placeholder="ページタイトル..." style={INP} />
                </div>
                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:11, color:COLORS.textMuted, display:"block", marginBottom:4 }}>フォルダ（省略可）</label>
                  <select value={newPageFolder??""} onChange={e => setNewPageFolder(e.target.value||null)} style={{ ...INP, background:"#fff" }}>
                    <option value="">現在のフォルダ（{path.length>0?path[path.length-1].name:"ホーム"}）</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
                  </select>
                </div>
                <button onClick={addPage} disabled={!newPageTitle.trim()}
                  style={{ width:"100%", padding:"9px 0", background:newPageTitle.trim()?COLORS.primary:COLORS.border, border:"none", borderRadius:8, fontSize:13, fontWeight:700, color:"#fff", cursor:newPageTitle.trim()?"pointer":"default" }}>
                  追加して編集
                </button>
              </div>

              <div style={{ height:1, background:COLORS.border, margin:"4px 0 18px" }} />

              <div style={{ marginBottom:18 }}>
                <div style={{ fontWeight:700, fontSize:13, color:COLORS.text, marginBottom:10 }}>📁 フォルダを追加</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                  {["📁","🌱","🍅","🌾","📋","🆘","💧","🧺","🌿","⚙️","📊","🔧"].map(e => (
                    <button key={e} onClick={() => setNewFolderIcon(e)}
                      style={{ width:36, height:36, fontSize:18, borderRadius:7, border:`2px solid ${newFolderIcon===e?COLORS.primary:COLORS.border}`, background:newFolderIcon===e?COLORS.bgSecondary:"#fff", cursor:"pointer" }}>
                      {e}
                    </button>
                  ))}
                </div>
                <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="フォルダ名..." style={{ ...INP, marginBottom:8 }} />
                <button onClick={addFolder} disabled={!newFolderName.trim()}
                  style={{ width:"100%", padding:"9px 0", background:newFolderName.trim()?COLORS.primary:COLORS.border, border:"none", borderRadius:8, fontSize:13, fontWeight:700, color:"#fff", cursor:newFolderName.trim()?"pointer":"default" }}>
                  フォルダを追加
                </button>
              </div>

              <div style={{ height:1, background:COLORS.border, margin:"4px 0 18px" }} />

              <div style={{ marginBottom:18 }}>
                <div style={{ fontWeight:700, fontSize:13, color:COLORS.text, marginBottom:10 }}>📝 ページを編集・削除</div>
                <div style={{ maxHeight:300, overflowY:"auto" }}>
                  {pages.length===0
                    ? <div style={{ fontSize:12, color:COLORS.textMuted }}>ページがありません</div>
                    : pages.map(p => {
                        const folder = folders.find(f => f.id === p.folderId);
                        return (
                          <div key={p.id} style={{ background:COLORS.bgSecondary, borderRadius:8, padding:"8px 10px", marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, fontWeight:600, color:COLORS.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</div>
                              <div style={{ fontSize:10, color:COLORS.textLight, marginTop:1 }}>{folder?folder.icon+" "+folder.name:"ルート"}</div>
                            </div>
                            <button onClick={() => { setEditDraft({...p}); setOpenPage(p); setEditMode(true); setEditPanel(false); }}
                              style={{ background:"none", border:`1px solid ${COLORS.border}`, borderRadius:6, padding:"4px 8px", fontSize:11, cursor:"pointer", color:COLORS.primary, flexShrink:0 }}>✏️</button>
                            <button onClick={() => delPage(p.id)}
                              style={{ background:"none", border:`1px solid ${COLORS.danger}44`, borderRadius:6, padding:"4px 8px", fontSize:11, cursor:"pointer", color:COLORS.danger, flexShrink:0 }}>🗑</button>
                          </div>
                        );
                      })
                  }
                </div>
              </div>

              <div style={{ height:1, background:COLORS.border, margin:"4px 0 18px" }} />

              <div>
                <div style={{ fontWeight:700, fontSize:13, color:COLORS.text, marginBottom:10 }}>🗑 フォルダを削除</div>
                <div style={{ maxHeight:200, overflowY:"auto" }}>
                  {folders.map(f => (
                    <div key={f.id} style={{ background:COLORS.bgSecondary, borderRadius:8, padding:"8px 10px", marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:18, flexShrink:0 }}>{f.icon}</span>
                      <span style={{ fontSize:12, color:COLORS.text, flex:1 }}>{f.name}</span>
                      <button onClick={() => delFolder(f.id)}
                        style={{ background:"none", border:`1px solid ${COLORS.danger}44`, borderRadius:6, padding:"4px 8px", fontSize:11, cursor:"pointer", color:COLORS.danger, flexShrink:0 }}>🗑</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:24 }}>
          <div style={{ background:"#fff", borderRadius:16, padding:24, width:"100%", maxWidth:300, boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:15, color:COLORS.text, marginBottom:20, lineHeight:1.6, fontWeight:500 }}>{confirmState.msg}</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setConfirmState(null)} style={{ flex:1, padding:"10px 0", border:`1px solid ${COLORS.border}`, background:"transparent", borderRadius:8, fontSize:14, cursor:"pointer" }}>キャンセル</button>
              <button onClick={() => { confirmState.onOk(); setConfirmState(null); }} style={{ flex:1, padding:"10px 0", border:"none", background:COLORS.danger, borderRadius:8, fontSize:14, fontWeight:700, color:"#fff", cursor:"pointer" }}>削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function HomeIcon({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? COLORS.primary : "none"} stroke={active ? COLORS.primary : COLORS.textLight} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>;
}
function CalIcon({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? COLORS.primary : COLORS.textLight} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function AIIcon({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? COLORS.primary : COLORS.textLight} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M12 13v3m-4 3h8"/><path d="M8 8h.01M12 6h.01M16 8h.01"/></svg>;
}
function MapIcon({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? COLORS.primary : COLORS.textLight} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
}
function BookIcon({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? COLORS.primary : COLORS.textLight} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}
