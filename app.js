/********************************************************
 RHAN – Teacher Productivity App
 Clean & Fixed Modular Version with Calendar Delete
********************************************************/

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ===============================
   GROUP SYNC SYSTEM
================================ */
let groupID = localStorage.getItem("calendarGroup");

if (!groupID) {
  groupID = prompt("Enter family or teacher group code:");
  localStorage.setItem("calendarGroup", groupID);
}

/* ===============================
   GLOBAL STATE
================================ */
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let calendarEvents = JSON.parse(localStorage.getItem("calendarEvents")) || [];

let filter = "all";
let selectedFileURL = null;
let selectedDateForEvent = null;

const todayDate = new Date();
let currentMonth = todayDate.getMonth();
let currentYear = todayDate.getFullYear();

/* ===============================
   DOM REFERENCES
================================ */
// Tasks
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const taskCategory = document.getElementById("taskCategory");
const taskTags = document.getElementById("taskTags");
const taskReminder = document.getElementById("taskReminder");
const taskURL = document.getElementById("taskURL");
const taskFile = document.getElementById("taskFile");
const chooseFileBtn = document.getElementById("chooseFileBtn");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");

// Filters
const filterAll = document.getElementById("filterAll");
const filterToday = document.getElementById("filterToday");
const filterUpcoming = document.getElementById("filterUpcoming");
const filterCompleted = document.getElementById("filterCompleted");

// Calendar
const calendarBody = document.getElementById("calendarBody");
const monthYear = document.getElementById("monthYear");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

// Event Modal
const eventModal = document.getElementById("eventModal");
const eventTitle = document.getElementById("eventTitle");
const eventTime = document.getElementById("eventTime");
const eventReminder = document.getElementById("eventReminder");
const eventColorPicker = document.getElementById("eventColorPicker");
const eventColorText = document.getElementById("eventColorText");
const saveEventBtn = document.getElementById("saveEventBtn");
const cancelEventBtn = document.getElementById("cancelEventBtn");
const deleteEventBtn = document.getElementById("deleteEventBtn");

// Pomodoro
const timerDisplay = document.getElementById("timerDisplay");
const startTimerBtn = document.getElementById("startTimer");
const pauseTimerBtn = document.getElementById("pauseTimer");
const resetTimerBtn = document.getElementById("resetTimer");

// Install
const installBtn = document.getElementById("installBtn");

// Change group
const changeGroupBtn = document.getElementById("changeGroupBtn");
changeGroupBtn.onclick = () => {
  const newGroup = prompt("Enter new group code:");
  if (!newGroup) return;
  localStorage.setItem("calendarGroup", newGroup);
  location.reload();
};

/* ===============================
   TASK SYSTEM
================================ */
addBtn.onclick = addTask;

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const newTask = {
    text,
    done: false,
    date: taskDate.value || null,
    priority: parseInt(taskPriority.value),
    category: taskCategory.value,
    tags: taskTags.value.split(",").map(t => t.trim()).filter(Boolean),
    reminder: taskReminder.checked,
    url: selectedFileURL || taskURL.value.trim() || null
  };

  tasks.push(newTask);
  saveTasks();
  resetTaskInputs();
  renderTasks();
  scheduleTaskReminders();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function resetTaskInputs() {
  taskInput.value = "";
  taskDate.value = "";
  taskPriority.value = 2;
  taskCategory.value = "General";
  taskTags.value = "";
  taskReminder.checked = false;
  taskURL.value = "";
  taskFile.value = "";
  fileNameDisplay.textContent = "No file selected";
  selectedFileURL = null;
}

function renderTasks() {
  taskList.innerHTML = "";
  const today = new Date().toISOString().split("T")[0];

  tasks.forEach((task, index) => {
    if (filter === "today" && task.date !== today) return;
    if (filter === "upcoming" && (!task.date || task.date <= today)) return;
    if (filter === "completed" && !task.done) return;

    const li = document.createElement("li");
    if (task.done) li.classList.add("done");

    li.innerHTML = `
      <div>
        ${task.url
          ? `<a href="${task.url}" target="_blank">${task.text}</a>`
          : task.text}
        ${task.date ? `<small>${task.date}</small>` : ""}
      </div>
      <div>
        <button onclick="toggleDone(${index})">✔️</button>
        <button onclick="deleteTask(${index})">🗑️</button>
      </div>
    `;

    taskList.appendChild(li);
  });
}

function toggleDone(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

window.toggleDone = toggleDone;
window.deleteTask = deleteTask;

/* ===============================
   FILE PICKER
================================ */
chooseFileBtn.onclick = () => taskFile.click();

taskFile.onchange = () => {
  const file = taskFile.files[0];
  if (file) {
    fileNameDisplay.textContent = file.name;
    selectedFileURL = URL.createObjectURL(file);
  }
};

/* ===============================
   FILTERS
================================ */
filterAll.onclick = () => setFilter("all");
filterToday.onclick = () => setFilter("today");
filterUpcoming.onclick = () => setFilter("upcoming");
filterCompleted.onclick = () => setFilter("completed");

function setFilter(type) {
  filter = type;
  renderTasks();
}

/* ===============================
   HOLIDAYS
================================ */
function getHolidays(year) {
  return [
    { date: `${year}-01-01`, label: "New Year's Day", type: "ph-holiday" },
    { date: `${year}-02-25`, label: "EDSA People Power", type: "ph-holiday" },
    { date: `${year}-04-09`, label: "Araw ng Kagitingan", type: "ph-holiday" },
    { date: `${year}-05-01`, label: "Labor Day (PH)", type: "ph-holiday" },
    { date: `${year}-06-12`, label: "Independence Day (PH)", type: "ph-holiday" },
    { date: `${year}-08-21`, label: "Ninoy Aquino Day", type: "ph-holiday" },
    { date: `${year}-08-26`, label: "National Heroes Day", type: "ph-holiday" },
    { date: `${year}-11-30`, label: "Bonifacio Day", type: "ph-holiday" },
    { date: `${year}-12-25`, label: "Christmas Day", type: "ph-holiday" },
    { date: `${year}-12-30`, label: "Rizal Day", type: "ph-holiday" },

    { date: `${year}-03-08`, label: "International Women's Day", type: "intl-holiday" },
    { date: `${year}-04-22`, label: "Earth Day", type: "intl-holiday" },
    { date: `${year}-06-05`, label: "World Environment Day", type: "intl-holiday" },
    { date: `${year}-09-21`, label: "International Peace Day", type: "intl-holiday" },
    { date: `${year}-10-05`, label: "World Teachers' Day", type: "intl-holiday" },
    { date: `${year}-12-10`, label: "Human Rights Day", type: "intl-holiday" }
  ];
}

/* ===============================
   CALENDAR
================================ */
function renderCalendar() {
  calendarBody.innerHTML = "";
  const holidays = getHolidays(currentYear);
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  monthYear.textContent =
    `${new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })} ${currentYear}`;

  let date = 1;
  const todayStr = new Date().toISOString().split("T")[0];

  for (let i = 0; i < 6; i++) {
    const row = document.createElement("tr");

    for (let j = 0; j < 7; j++) {
      const cell = document.createElement("td");

      if (i === 0 && j < firstDay) { row.appendChild(cell); continue; }
      if (date > daysInMonth) break;

      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

      // Highlight today
      if (dateStr === todayStr) {
        cell.style.border = "2px solid var(--primary)";
        cell.style.borderRadius = "8px";
      }

      cell.textContent = date;

      // Holidays
      holidays.filter(h => h.date === dateStr).forEach(h => {
        cell.classList.add(h.type);
        const label = document.createElement("div");
        label.className = "holiday-label";
        label.textContent = h.label;
        label.title = h.label;
        cell.appendChild(label);
      });

      // Tasks
      tasks.filter(t => t.date === dateStr).forEach(t => {
        const label = document.createElement("div");
        label.className = "event-label";
        label.textContent = t.text;
        label.title = `Task: ${t.text}\nCategory: ${t.category}`;
        label.setAttribute("data-type", `task-priority-${t.priority}`);
        cell.appendChild(label);
      });

      // Custom events
      calendarEvents.filter(e => e.date === dateStr).forEach(e => {
        const label = document.createElement("div");
        label.className = "event-label";
        label.textContent = e.title;
        label.title = e.time ? `${e.title} at ${e.time}` : e.title;
        label.style.background = e.color || "var(--primary)";
        label.setAttribute("data-type", "custom-event");
        cell.appendChild(label);
      });

      // Click cell to open modal
      cell.onclick = () => {
        const existingEvent = calendarEvents.find(e => e.date === dateStr);
        openEventModal(dateStr, existingEvent);
      };

      row.appendChild(cell);
      date++;
    }

    calendarBody.appendChild(row);
  }
}

// Navigate months
prevMonth.onclick = () => { currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;} renderCalendar(); };
nextMonth.onclick = () => { currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;} renderCalendar(); };

/* ===============================
   EVENT MODAL
================================ */
function openEventModal(dateStr, existingEvent = null) {
  selectedDateForEvent = dateStr;
  eventModal.style.display = "flex";

  if (existingEvent) {
    eventTitle.value = existingEvent.title;
    eventTime.value = existingEvent.time || "";
    eventColorPicker.value = existingEvent.color || "#4CAF50";
    eventColorText.value = eventColorPicker.value;
    eventReminder.checked = existingEvent.reminder || false;

    deleteEventBtn.style.display = "block";
    deleteEventBtn.onclick = () => deleteEvent(existingEvent);
  } else {
    resetEventForm();
    deleteEventBtn.style.display = "none";
  }
}

cancelEventBtn.onclick = () => { eventModal.style.display = "none"; resetEventForm(); };

saveEventBtn.onclick = async () => {
  if (!eventTitle.value.trim()) return;

  const newEvent = {
    date: selectedDateForEvent,
    title: eventTitle.value.trim(),
    time: eventTime.value || null,
    color: eventColorPicker.value,
    reminder: eventReminder.checked
  };

  calendarEvents.push(newEvent);
  localStorage.setItem("calendarEvents", JSON.stringify(calendarEvents));

  if (typeof db !== "undefined") {
    await db.collection("groups").doc(groupID).collection("events").add(newEvent);
  }

  if (newEvent.reminder && newEvent.time) scheduleEventReminder(newEvent);

  eventModal.style.display = "none";
  resetEventForm();
  renderCalendar();
};

function resetEventForm() {
  eventTitle.value = "";
  eventTime.value = "";
  eventReminder.checked = false;
  eventColorPicker.value = "#4CAF50";
  eventColorText.value = "#4CAF50";
}

eventColorPicker.oninput = () => { eventColorText.value = eventColorPicker.value; };
eventColorText.oninput = () => { eventColorPicker.value = eventColorText.value; };

// Delete event
function deleteEvent(eventObj) {
  calendarEvents = calendarEvents.filter(e => e !== eventObj);
  localStorage.setItem("calendarEvents", JSON.stringify(calendarEvents));

  if (typeof db !== "undefined") {
    db.collection("groups").doc(groupID).collection("events")
      .where("date","==",eventObj.date)
      .where("title","==",eventObj.title)
      .get()
      .then(snapshot => { snapshot.forEach(doc => doc.ref.delete()); });
  }

  eventModal.style.display = "none";
  renderCalendar();
}

/* ===============================
   POMODORO
================================ */
let pomodoroDuration = 25*60;
let timer = pomodoroDuration;
let interval = null;

function updateDisplay() {
  const min = Math.floor(timer/60);
  const sec = timer%60;
  timerDisplay.textContent = `${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

startTimerBtn.onclick = () => {
  if(interval) return;
  interval = setInterval(() => {
    if(timer>0){ timer--; updateDisplay(); }
    else{
      clearInterval(interval); interval=null; timer=pomodoroDuration; updateDisplay();
      if(Notification.permission==="granted") new Notification("Pomodoro Complete!");
    }
  },1000);
};

pauseTimerBtn.onclick = () => { clearInterval(interval); interval=null; };
resetTimerBtn.onclick = () => { clearInterval(interval); interval=null; timer=pomodoroDuration; updateDisplay(); };

/* ===============================
   NOTIFICATIONS
================================ */
if("Notification" in window && Notification.permission!=="granted") Notification.requestPermission();

function scheduleTaskReminders() {
  if(Notification.permission!=="granted") return;
  const now = new Date();
  tasks.forEach(task=>{
    if(task.reminder && task.date && !task.done){
      const taskTime=new Date(task.date+"T09:00");
      const delay = taskTime-now;
      if(delay>0) setTimeout(()=>{ new Notification("RHAN Reminder",{body: task.text}); }, delay);
    }
  });
}

function scheduleEventReminder(event){
  if(Notification.permission!=="granted") return;
  const eventDateTime = new Date(event.date+"T"+event.time);
  const delay = eventDateTime - new Date();
  if(delay>0) setTimeout(()=>{ new Notification("Calendar Reminder",{body:`${event.title} at ${event.time}`}); }, delay);
}

/* ===============================
   PWA INSTALL
================================ */
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); deferredPrompt = e; installBtn.style.display="block";
});
installBtn.onclick = async () => { if(!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt=null; installBtn.style.display="none"; };

/* ===============================
   FIREBASE REAL-TIME SYNC
================================ */
if(typeof db!=="undefined") {
  db.collection("groups").doc(groupID).collection("events").onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change=>{
      if(change.type==="added"){
        const event=change.doc.data();
        const exists = calendarEvents.some(e=>e.date===event.date && e.title===event.title && e.time===event.time);
        if(!exists) calendarEvents.push(event);
      }
    });
    localStorage.setItem("calendarEvents", JSON.stringify(calendarEvents));
    renderCalendar();
  });
}

/* ===============================
   INIT
================================ */
renderTasks();
renderCalendar();
updateDisplay();
scheduleTaskReminders();
// Splash screen controller
window.addEventListener("load", () => {
  setTimeout(() => {
    document.body.classList.add("loaded");

    // Remove splash completely after fade
    setTimeout(() => {
      const splash = document.getElementById("splash-screen");
      if (splash) splash.remove();
    }, 600);

  }, 2800); // Total splash duration
});