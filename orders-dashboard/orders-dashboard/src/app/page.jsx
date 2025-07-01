"use client";


import React, { useState, useEffect, useCallback } from "react";
import { format, isBefore, startOfDay, differenceInDays, getHours, subDays, startOfMonth, endOfMonth, isAfter } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Sector,
} from "recharts";
import {
  FileDown,
  UploadCloud,
  BarChart3,
  TimerReset,
  ClipboardList,
  Globe,
  Sun,
  Moon,
  Lock,
  History,
  Trash2,
  Search,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";

// Supabase Configuration
const SUPABASE_URL = "https://ucgiatobbjnqertgtmsw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZ2lhdG9iYmpucWVydGd0bXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTg1MjgsImV4cCI6MjA2Njg5NDUyOH0.EgqlPh4VHPsmHEII1snAmJgyZBp8rkf6u5N7SAxA4zs";

// Simple Card components for consistent styling
const Card = ({ children, className = "" }) => (
  <div className={`p-4 border border-gray-700 rounded-xl mb-4 bg-gray-800 shadow-xl ${className}`}>
    {children}
  </div>
);
const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 space-y-2 ${className}`}>{children}</div>
);

// Translation object for multiple languages
const translations = {
  cz: {
    title: "Přehled zakázek",
    upload: "Nahrát soubor",
    export: "Export do PDF",
    total: "Zakázky",
    done: "Hotovo",
    remaining: "Zbývá",
    inProgress: "V procesu",
    newOrders: "Nové",
    pallets: "Palety",
    carton: "Karton",
    delayed: "Zpožděné zakázky",
    sentPallets: "Odesláno palet",
    sentCartons: "Odesláno balíků",
    statuses: "Statusy celkem",
    types: "Typy dodávek",
    switchLang: "EN",
    langCode: "CZ",
    switchTheme: "Světlý režim",
    uploadFilePrompt: "Nahraj soubor pro zobrazení dat.",
    ordersOverTime: "Zakázky v čase",
    statusDistribution: "Rozložení statusů",
    orderTypes: "Typy dodávek",
    deliveryNo: "Číslo dodávky",
    status: "Status",
    deliveryType: "Typ dodávky",
    loadingDate: "Datum nakládky",
    delay: "Zpoždění (dny)",
    note: "Poznámka",
    loginTitle: "Přihlášení",
    username: "Uživatelské jméno",
    password: "Heslo",
    loginButton: "Přihlásit se",
    loginError: "Nesprávné uživatelské jméno nebo heslo.",
    logout: "Odhlásit se",
    totalDelayed: "Celkem zpožděných",
    shift: "Směna",
    hourlyOverview: "Hodinový přehled (dnešní den)",
    shift1: "Směna 1 (5:45 - 13:45)",
    shift2: "Směna 2 (13:45 - 21:45)",
    currentShift: "Aktuální směna",
    noShift: "Mimo směnu",
    history: "Historie importů",
    selectImport: "Vyber import",
    importTime: "Čas importu",
    fileName: "Název souboru",
    deleteConfirm: "Opravdu chcete smazat tento import?",
    yes: "Ano",
    no: "Ne",
    inProgressOnly: "V procesu",
    shipments: "Odeslané zakázky",
    showMore: "Zobrazit více",
    showLess: "Zobrazit méně",
    moreItems: "dalších",
    searchDelivery: "Vyhledat zakázku",
    enterDeliveryNo: "Zadejte číslo dodávky",
    deliveryDetails: "Detaily dodávky",
    deliveryNotFound: "Dodávka nenalezena.",
    forwardingAgent: "Jméno dopravce",
    shipToPartyName: "Jméno příjemce",
    totalWeight: "Celková hmotnost",
    close: "Zavřít",
    filters: "Filtry dat",
    timeRange: "Časový rozsah",
    allTime: "Celá historie",
    last7Days: "Posledních 7 dní",
    thisMonth: "Tento měsíc",
    customRange: "Vlastní rozsah",
    applyFilters: "Použít filtry",
    clearFilters: "Vymazat filtry",
    filterByDeliveryType: "Filtrovat dle typu dodávky",
    filterByStatus: "Filtrovat dle statusu",
    barChart: "Sloupcový graf",
    pieChart: "Koláčový graf",
    lineChart: "Čárový graf",
    stackedBarChart: "Skládaný sloupcový graf", // New translation
    shiftComparison: "Srovnání směn (Hotovo)",
    shift1Name: "Ranní směna",
    shift2Name: "Odpolední směna",
    toggleFilters: "Filtry", // New translation for toggle button
  },
  en: {
    title: "Order Overview",
    upload: "Upload file",
    export: "Export to PDF",
    total: "Orders",
    done: "Completed",
    remaining: "Remaining",
    inProgress: "In Progress",
    newOrders: "New",
    pallets: "Pallets",
    carton: "Cartons",
    delayed: "Delayed Orders",
    sentPallets: "Pallets Sent",
    sentCartons: "Cartons Sent",
    statuses: "Total Statuses",
    types: "Delivery Types",
    switchLang: "DE",
    langCode: "EN",
    switchTheme: "Dark Mode",
    uploadFilePrompt: "Upload a file to display data.",
    ordersOverTime: "Orders Over Time",
    statusDistribution: "Status Distribution",
    orderTypes: "Order Types",
    deliveryNo: "Delivery No.",
    status: "Status",
    deliveryType: "Delivery Type",
    loadingDate: "Loading Date",
    delay: "Delay (days)",
    note: "Note",
    loginTitle: "Login",
    username: "Username",
    password: "Password",
    loginButton: "Login",
    loginError: "Incorrect username or password.",
    logout: "Logout",
    totalDelayed: "Total Delayed",
    shift: "Shift",
    hourlyOverview: "Hourly Overview (Today)",
    shift1: "Shift 1 (5:45 AM - 1:45 PM)",
    shift2: "Shift 2 (1:45 PM - 9:45 PM)",
    currentShift: "Current Shift",
    noShift: "Outside Shift",
    history: "Import History",
    selectImport: "Select Import",
    importTime: "Import Time",
    fileName: "File Name",
    deleteConfirm: "Are you sure you want to delete this import?",
    yes: "Yes",
    no: "No",
    inProgressOnly: "In Progress",
    shipments: "Shipments",
    showMore: "Show more",
    showLess: "Show less",
    moreItems: "more",
    searchDelivery: "Search Order",
    enterDeliveryNo: "Enter Delivery No.",
    deliveryDetails: "Delivery Details",
    deliveryNotFound: "Delivery not found.",
    forwardingAgent: "Forwarding Agent Name",
    shipToPartyName: "Name of Ship-to Party",
    totalWeight: "Total Weight",
    close: "Close",
    filters: "Data Filters",
    timeRange: "Time Range",
    allTime: "All Time",
    last7Days: "Last 7 Days",
    thisMonth: "This Month",
    customRange: "Custom Range",
    applyFilters: "Apply Filters",
    clearFilters: "Clear Filters",
    filterByDeliveryType: "Filter by Delivery Type",
    filterByStatus: "Filter by Status",
    barChart: "Bar Chart",
    pieChart: "Pie Chart",
    lineChart: "Line Chart",
    stackedBarChart: "Stacked Bar Chart",
    shiftComparison: "Shift Comparison (Completed)",
    shift1Name: "Morning Shift",
    shift2Name: "Afternoon Shift",
    toggleFilters: "Filters",
  },
  de: {
    title: "Auftragsübersicht",
    upload: "Datei hochladen",
    export: "Als PDF exportieren",
    total: "Aufträge",
    done: "Abgeschlossen",
    remaining: "Verbleibend",
    inProgress: "In Bearbeitung",
    newOrders: "Neu",
    pallets: "Paletten",
    carton: "Kartons",
    delayed: "Verspätete Aufträge",
    sentPallets: "Gesendete Paletten",
    sentCartons: "Gesendete Kartons",
    statuses: "Gesamtstatus",
    types: "Lieferarten",
    switchLang: "CZ",
    langCode: "DE",
    switchTheme: "Dunkler Modus",
    uploadFilePrompt: "Laden Sie eine Datei hoch, um Daten anzuzeigen.",
    ordersOverTime: "Aufträge im Zeitverlauf",
    statusDistribution: "Statusverteilung",
    orderTypes: "Auftragsarten",
    deliveryNo: "Liefernummer",
    status: "Status",
    deliveryType: "Lieferart",
    loadingDate: "Ladedatum",
    delay: "Verzögerung (Tage)",
    note: "Notiz",
    loginTitle: "Anmeldung",
    username: "Benutzername",
    password: "Passwort",
    loginButton: "Anmelden",
    loginError: "Falscher Benutzername oder Passwort.",
    logout: "Abmelden",
    totalDelayed: "Gesamt verspätet",
    shift: "Schicht",
    hourlyOverview: "Stündliche Übersicht (Heute)",
    shift1: "Schicht 1 (5:45 - 13:45 Uhr)",
    shift2: "Schicht 2 (13:45 - 21:45 Uhr)",
    currentShift: "Aktuelle Schicht",
    noShift: "Außerhalb der Schicht",
    history: "Importverlauf",
    selectImport: "Import auswählen",
    importTime: "Importzeit",
    fileName: "Dateiname",
    deleteConfirm: "Möchten Sie diesen Import wirklich löschen?",
    yes: "Ja",
    no: "Nein",
    inProgressOnly: "In Bearbeitung",
    shipments: "Lieferungen",
    showMore: "Mehr anzeigen",
    showLess: "Weniger anzeigen",
    moreItems: "weitere",
    searchDelivery: "Auftrag suchen",
    enterDeliveryNo: "Liefernummer eingeben",
    deliveryDetails: "Lieferdetails",
    deliveryNotFound: "Lieferung nicht gefunden.",
    forwardingAgent: "Spediteur Name",
    shipToPartyName: "Name des Empfängers",
    totalWeight: "Gesamtgewicht",
    close: "Schließen",
    filters: "Datenfilter",
    timeRange: "Zeitbereich",
    allTime: "Gesamte Zeit",
    last7Days: "Letzte 7 Tage",
    thisMonth: "Dieser Monat",
    customRange: "Benutzerdefinierter Bereich",
    applyFilters: "Filter anwenden",
    clearFilters: "Filter löschen",
    filterByDeliveryType: "Nach Lieferart filtern",
    filterByStatus: "Nach Status filtern",
    barChart: "Balkendiagramm",
    pieChart: "Tortendiagramm",
    lineChart: "Liniendiagramm",
    stackedBarChart: "Gestapeltes Balkendiagramm",
    shiftComparison: "Schichtvergleich (Abgeschlossen)",
    shift1Name: "Morgenschicht",
    shift2Name: "Nachmittagsschicht",
    toggleFilters: "Filter",
  },
};

// Define a consistent color palette for charts
const CHART_COLORS = [
  '#FFFFFF', // White (NEW for "Zakázky" total)
  '#EF4444', // Red (Remaining)
  '#3B82F6', // Lighter Blue (New Orders)
  '#F59E0B', // Orange (In Progress)
  '#10B981', // Green (Done)
  '#3498DB', // Blue (for other general bars)
  '#9B59B6', // Purple (available for others)
  '#28A745', // Darker Green (Status 60)
  '#218838', // Even Darker Green (Status 70)
  '#FFC107', // Yellow (Status 31)
  '#FF9800', // Darker Orange (Status 35)
  '#FF5722', // Red-Orange (Status 40)
];

// Colors for date categories in stacked charts
const DATE_CATEGORY_COLORS = {
  'Today': '#3498DB',    // Blue
  'Yesterday': '#9B59B6', // Purple
  'Older': '#E74C3C',    // Red
  'Future': '#2ECC71',   // Green
};

export default function ZakazkyDashboard() {
  const [lang, setLang] = useState("cz");
  const [darkMode, setDarkMode] = useState(true);
  const [rawExcelData, setRawExcelData] = useState([]); // Stores the original, unfiltered data
  const [summary, setSummary] = useState(null); // Processed summary data based on current filters
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [importHistory, setImportHistory] = useState([]);
  const [selectedImportId, setSelectedImportId] = useState(null);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState(null);
  const [showAllDelayed, setShowAllDelayed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Filter states
  const [filtersCollapsed, setFiltersCollapsed] = useState(true); // New state for filter collapse
  const [filterTimeRange, setFilterTimeRange] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDeliveryType, setFilterDeliveryType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Chart type states
  const [chartTypeOrdersOverTime, setChartTypeOrdersOverTime] = useState('bar');
  const [chartTypeStatusDistribution, setChartTypeStatusDistribution] = useState('bar');
  const [chartTypeOrderTypes, setChartTypeOrderTypes] = useState('bar');

  const t = translations[lang];

  // Dynamically load external scripts (XLSX, jsPDF, html2canvas, Supabase)
  useEffect(() => {
    const loadScript = (src, id, onloadCallback) => {
      if (document.getElementById(id)) {
        if (onloadCallback) onloadCallback();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.onload = onloadCallback;
      script.onerror = () => console.error(`Failed to load script: ${src}`);
      document.head.appendChild(script);
    };

    loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'xlsx-script', () => {
      console.log('XLSX loaded');
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf-script', () => {
        console.log('jsPDF loaded');
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas-script', () => {
          console.log('html2canvas loaded');
          loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', 'supabase-js-script', () => {
            console.log('Supabase JS loaded');
            if (window.supabase && !supabaseClient) {
              setSupabaseClient(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
            }
          });
        });
      });
    });

    return () => {
      // Cleanup scripts if needed
    };
  }, []);

  // Helper function to parse Excel dates
  const parseExcelDate = (excelDate) => {
    if (typeof excelDate === "number") {
      if (typeof window.XLSX === 'undefined' || typeof window.XLSX.SSF === 'undefined') {
        console.error("XLSX.SSF not loaded. Cannot parse Excel date number.");
        return null;
      }
      const parsed = window.XLSX.SSF.parse_date_code(excelDate);
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    } else if (typeof excelDate === "string") {
      const parts = excelDate.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
      if (parts) {
        return new Date(parts[3], parts[1] - 1, parts[2]);
      }
      return new Date(excelDate); // Fallback for other string date formats
    }
    return null;
  };

  // Main data processing logic (now takes already filtered rows)
  const processData = useCallback((rows) => {
    const now = new Date();
    const today = startOfDay(now);
    const currentShift = getCurrentShift(now);

    // Day offsets for summary cards (Yesterday, Today, Tomorrow, Day after Tomorrow)
    const dayOffsets = [-1, 0, 1, 2];

    const result = {
      totalToday: 0,
      statusCounts: {},
      byDay: {},
      deliveryTypes: {},
      delayed: 0,
      inProgress: 0,
      doneTotal: 0,
      remainingTotal: 0,
      newOrders: 0,
      sentPallets: 0,
      sentCartons: 0,
      delayedOrdersList: [],
      currentShift: currentShift,
      hourlyStatusSnapshots: {},
      shiftDoneCounts: { '1': 0, '2': 0 },
      statusByDateCategory: {}, // New for stacked status chart
      deliveryTypeByDateCategory: {}, // New for stacked delivery type chart
    };

    // Initialize hourly snapshots for today (06:00 to 22:00)
    for (let h = 6; h <= 22; h++) {
      const hourKey = format(new Date(today.getFullYear(), today.getMonth(), today.getDate(), h), 'HH:00');
      result.hourlyStatusSnapshots[hourKey] = {
        '10': 0, '31': 0, '35': 0, '40': 0, '50': 0, '60': 0, '70': 0,
      };
    }

    const doneStatuses = [50, 60, 70];
    const remainingStatuses = [10, 31, 35, 40];
    const inProgressStatuses = [31, 35, 40];
    const newOrderStatuses = [10];
    const sentStatuses = [60, 70];

    // Initialize byDay for the fixed offsets
    for (let offset of dayOffsets) {
      const day = format(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset),
        "yyyy-MM-dd"
      );
      result.byDay[day] = {
        total: 0, done: 0, remaining: 0, inProgress: 0, newOrders: 0, pallets: 0, cartons: 0,
      };
    }

    const todayDateStr = format(today, 'yyyy-MM-dd');
    const yesterdayDateStr = format(subDays(today, 1), 'yyyy-MM-dd');

    rows.forEach((row) => {
      const loadingDate = row["Loading Date"];
      const status = Number(row["Status"]);
      const delType = row["del.type"];
      const deliveryNo = row["Delivery"] || row["Delivery No"];

      if (!loadingDate || isNaN(status)) return;

      const parsedDate = parseExcelDate(loadingDate);

      if (parsedDate === null || isNaN(parsedDate.getTime())) {
        console.warn(`Invalid Loading Date for row: ${JSON.stringify(row)}`);
        return;
      }

      const formattedDate_YYYYMMDD = format(parsedDate, "yyyy-MM-dd");
      const formattedDate_DDMMYYYY = format(parsedDate, "dd/MM/yyyy");

      // Determine date category for stacked charts
      let dateCategoryName;
      if (formattedDate_YYYYMMDD === todayDateStr) {
        dateCategoryName = 'Today';
      } else if (formattedDate_YYYYMMDD === yesterdayDateStr) {
        dateCategoryName = 'Yesterday';
      } else if (isBefore(parsedDate, today)) {
        dateCategoryName = 'Older';
      } else if (isAfter(parsedDate, today)) { // Check if it's in the future
        dateCategoryName = 'Future';
      } else {
        dateCategoryName = 'Other'; // Fallback for any other case
      }

      // Aggregate for statusByDateCategory
      if (!result.statusByDateCategory[status]) {
        result.statusByDateCategory[status] = { 'Today': 0, 'Yesterday': 0, 'Older': 0, 'Future': 0 };
      }
      if (result.statusByDateCategory[status][dateCategoryName] !== undefined) {
          result.statusByDateCategory[status][dateCategoryName]++;
      }


      // Aggregate for deliveryTypeByDateCategory
      if (!result.deliveryTypeByDateCategory[delType]) {
        result.deliveryTypeByDateCategory[delType] = { 'Today': 0, 'Yesterday': 0, 'Older': 0, 'Future': 0 };
      }
      if (result.deliveryTypeByDateCategory[delType][dateCategoryName] !== undefined) {
          result.deliveryTypeByDateCategory[delType][dateCategoryName]++;
      }


      // Aggregate for byDay cards (fixed for yesterday, today, tomorrow, etc.)
      if (result.byDay[formattedDate_YYYYMMDD]) {
        result.byDay[formattedDate_YYYYMMDD].total += 1;
        if (doneStatuses.includes(status)) result.byDay[formattedDate_YYYYMMDD].done += 1;
        if (remainingStatuses.includes(status)) result.byDay[formattedDate_YYYYMMDD].remaining += 1;
        if (inProgressStatuses.includes(status)) result.byDay[formattedDate_YYYYMMDD].inProgress += 1;
        if (newOrderStatuses.includes(status)) result.byDay[formattedDate_YYYYMMDD].newOrders += 1;
        if (delType === "P") result.byDay[formattedDate_YYYYMMDD].pallets += 1;
        if (delType === "K") result.byDay[formattedDate_YYYYMMDD].cartons += 1;
      }

      // Overall summary counts (apply to the filtered dataset)
      if (doneStatuses.includes(status)) {
        result.doneTotal += 1;

        // Determine shift for done orders for the shift comparison chart
        const orderHour = getHours(parsedDate);
        const orderMinutes = parsedDate.getMinutes();
        const orderTimeInMinutes = orderHour * 60 + orderMinutes;

        const shift1Start = 5 * 60 + 45; // 5:45 AM
        const shift1End = 13 * 60 + 45; // 1:45 PM

        const shift2Start = 13 * 60 + 45; // 1:45 PM
        const shift2End = 21 * 60 + 45; // 9:45 PM

        if (orderTimeInMinutes >= shift1Start && orderTimeInMinutes < shift1End) {
          result.shiftDoneCounts['1'] += 1;
        } else if (orderTimeInMinutes >= shift2Start && orderTimeInMinutes < shift2End) {
          result.shiftDoneCounts['2'] += 1;
        }
      }
      if (remainingStatuses.includes(status)) {
        result.remainingTotal += 1;
      }
      if (inProgressStatuses.includes(status)) {
        result.inProgress += 1;
      }
      if (newOrderStatuses.includes(status)) {
        result.newOrders += 1;
      }

      if (sentStatuses.includes(status)) {
        if (delType === "P") result.sentPallets += 1;
        if (delType === "K") result.sentCartons += 1;
      }

      if (isBefore(parsedDate, today) && !doneStatuses.includes(status)) {
        result.delayed += 1;
        const delayDays = differenceInDays(today, parsedDate);
        result.delayedOrdersList.push({
          delivery: deliveryNo || "N/A", status: status, delType: delType,
          loadingDate: formattedDate_DDMMYYYY, delayDays: delayDays, note: "",
        });
      }

      if (!isNaN(status)) {
        result.statusCounts[status] = (result.statusCounts[status] || 0) + 1;
      }
      if (delType) {
        result.deliveryTypes[delType] = (result.deliveryTypes[delType] || 0) + 1;
      }

      // Hourly status snapshots for the *current day of the processed data*
      if (format(parsedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        const hourKey = format(parsedDate, 'HH:00');
        if (result.hourlyStatusSnapshots[hourKey]) {
          if (result.hourlyStatusSnapshots[hourKey][status]) {
             result.hourlyStatusSnapshots[hourKey][status] += 1;
          } else {
             result.hourlyStatusSnapshots[hourKey][status] = 1;
          }
        }
      }
    });

    result.totalToday = result.byDay[format(today, "yyyy-MM-dd")]?.total || 0;

    return result;
  }, []);

  // Function to apply all filters and then process the data
  const applyFiltersAndProcessData = useCallback((dataToFilter) => {
    let currentFilteredRows = [...dataToFilter];
    const now = new Date();
    const today = startOfDay(now);

    // 1. Apply Time Range Filter
    let tempStartDate = null;
    let tempEndDate = null;

    if (filterTimeRange === 'yesterday') {
      tempStartDate = subDays(today, 1);
      tempEndDate = today; // Up to start of today
    } else if (filterTimeRange === 'today') {
      tempStartDate = today;
      tempEndDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1); // Up to start of tomorrow
    } else if (filterTimeRange === 'last7days') {
      tempStartDate = subDays(today, 6); // Includes today
      tempEndDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    } else if (filterTimeRange === 'thisMonth') {
      tempStartDate = startOfMonth(today);
      tempEndDate = endOfMonth(today);
      tempEndDate.setDate(tempEndDate.getDate() + 1); // To include the end of the month
    } else if (filterTimeRange === 'custom' && filterStartDate && filterEndDate) {
      tempStartDate = startOfDay(new Date(filterStartDate));
      tempEndDate = startOfDay(new Date(filterEndDate));
      tempEndDate.setDate(tempEndDate.getDate() + 1); // To include the end day
    }

    if (filterTimeRange !== 'all') {
      currentFilteredRows = currentFilteredRows.filter(row => {
        const parsedDate = parseExcelDate(row["Loading Date"]);
        if (parsedDate === null || isNaN(parsedDate.getTime())) return false;
        return parsedDate >= tempStartDate && parsedDate < tempEndDate;
      });
    }

    // 2. Apply Delivery Type Filter
    if (filterDeliveryType !== 'all') {
      currentFilteredRows = currentFilteredRows.filter(row => row["del.type"] === filterDeliveryType);
    }

    // 3. Apply Status Filter
    if (filterStatus !== 'all') {
      currentFilteredRows = currentFilteredRows.filter(row => Number(row["Status"]) === Number(filterStatus));
    }

    return processData(currentFilteredRows);
  }, [filterTimeRange, filterStartDate, filterEndDate, filterDeliveryType, filterStatus, processData]);

  // Effect to re-apply filters when filter states or rawExcelData changes
  useEffect(() => {
    if (rawExcelData.length > 0) {
      setSummary(applyFiltersAndProcessData(rawExcelData));
    } else {
      setSummary(null); // Clear summary if no raw data
    }
  }, [rawExcelData, applyFiltersAndProcessData]);

  // Fetch import history from Supabase on mount (after authentication and supabaseClient is ready)
  useEffect(() => {
    const fetchHistory = async () => {
      if (isAuthenticated && supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from("imports")
            .select("id, created_at, original_name, data, date_label")
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error fetching import history:", error);
          } else {
            setImportHistory(data);
            if (data.length > 0) {
              setSelectedImportId(data[0].id);
              setRawExcelData(data[0].data);
            }
          }
        } catch (e) {
          console.error("Caught error fetching import history:", e);
        }
      }
    };
    fetchHistory();
  }, [isAuthenticated, supabaseClient]);

  const handleLogin = () => {
    if (username === "Admin" && password === "Admin") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError(t.loginError);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    setSummary(null);
    setRawExcelData([]);
    setImportHistory([]);
    setSelectedImportId(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      if (typeof window.XLSX === 'undefined') {
        console.error("XLSX library not loaded.");
        return;
      }
      const workbook = window.XLSX.read(bstr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = window.XLSX.utils.sheet_to_json(worksheet);

      setRawExcelData(jsonData);

      if (supabaseClient) {
        try {
          const { data: savedData, error } = await supabaseClient.from("imports").insert([
            {
              created_at: new Date().toISOString(),
              original_name: file.name,
              data: jsonData,
              date_label: format(new Date(), "dd/MM/yyyy HH:mm"),
            },
          ]).select('id, created_at, original_name, date_label, data');

          if (error) {
            console.error("Error saving import to Supabase:", error);
          } else {
            setImportHistory(prevHistory => [savedData[0], ...prevHistory]);
            setSelectedImportId(savedData[0].id);
          }
        } catch (e) {
          console.error("Caught error saving import to Supabase:", e);
        }
      } else {
        console.warn("Supabase client not initialized. Data will not be saved to DB.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleSelectImport = async (e) => {
    const id = e.target.value;
    setSelectedImportId(id);
    if (id && supabaseClient) {
      try {
        const selectedImport = importHistory.find(item => item.id === id);
        if (selectedImport && selectedImport.data) {
          setRawExcelData(selectedImport.data);
        } else {
          const { data: fetchedImport, error } = await supabaseClient
            .from("imports")
            .select("data")
            .eq("id", id)
            .single();
          if (error) {
            console.error("Error fetching selected import data:", error);
            setSummary(null);
            setRawExcelData([]);
          } else {
            setRawExcelData(fetchedImport.data);
          }
        }
      } catch (e) {
        console.error("Caught error fetching selected import data:", e);
        setSummary(null);
        setRawExcelData([]);
      }
    } else {
      setSummary(null);
      setRawExcelData([]);
    }
  };

  const confirmDelete = (id) => {
    setItemToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteImport = async () => {
    if (!itemToDeleteId || !supabaseClient) return;

    try {
      const { error } = await supabaseClient
        .from("imports")
        .delete()
        .eq("id", itemToDeleteId);

      if (error) {
        console.error("Error deleting import:", error);
      } else {
        setImportHistory(prevHistory => prevHistory.filter(item => item.id !== itemToDeleteId));
        if (selectedImportId === itemToDeleteId) {
          setSummary(null);
          setRawExcelData([]);
          setSelectedImportId(null);
        }
      }
    } catch (e) {
      console.error("Caught error deleting import:", e);
    } finally {
      setShowDeleteConfirm(false);
      setItemToDeleteId(null);
    }
  };

  const exportPDF = () => {
    const input = document.getElementById("report-section");
    if (!input) return;

    if (typeof window.html2canvas === 'undefined' || typeof window.jsPDF === 'undefined') {
      console.error("html2canvas or jsPDF library not loaded.");
      return;
    }

    window.html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new window.jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save("report.pdf");
    });
  };

  const getCurrentShift = (date) => {
    const hours = getHours(date);
    const minutes = date.getMinutes();

    const shift1Start = 5 * 60 + 45;
    const shift1End = 13 * 60 + 45;

    const shift2Start = 13 * 60 + 45;
    const shift2End = 21 * 60 + 45;

    const currentTimeInMinutes = hours * 60 + minutes;

    if (currentTimeInMinutes >= shift1Start && currentTimeInMinutes < shift1End) {
      return 1;
    } else if (currentTimeInMinutes >= shift2Start && currentTimeInMinutes < shift2End) {
      return 2;
    }
    return null;
  };

  const getDelayColorClass = (delayDays) => {
    if (delayDays <= 1) return "text-green-400";
    if (delayDays <= 2) return "text-orange-400";
    return "text-red-400";
  };

  // Function to handle search
  const handleSearch = useCallback(() => { // Wrapped in useCallback
    if (!searchTerm || !rawExcelData || rawExcelData.length === 0) {
      setSearchResult(null);
      setShowSearchModal(true);
      return;
    }

    const foundItem = rawExcelData.find(row =>
      String(row["Delivery"] || row["Delivery No"]).trim() === String(searchTerm).trim()
    );

    setSearchResult(foundItem);
    setShowSearchModal(true);
  }, [searchTerm, rawExcelData]); // Dependencies for useCallback

  // Pie chart active shape for hover effect
  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#E5E7EB">{`Value: ${value}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">{`(Rate ${ (percent * 100).toFixed(2) }%)`}</text>
      </g>
    );
  };

  const [activeIndexStatus, setActiveIndexStatus] = useState(0);
  const onPieEnterStatus = useCallback((_, index) => {
    setActiveIndexStatus(index);
  }, []);

  const [activeIndexDelivery, setActiveIndexDelivery] = useState(0);
  const onPieEnterDelivery = useCallback((_, index) => {
    setActiveIndexDelivery(index);
  }, []);


  // Prepare data for Candlestick Chart (Hourly Overview)
  const candlestickChartData = summary?.hourlyStatusSnapshots ? Object.entries(summary.hourlyStatusSnapshots)
    .sort(([hourA], [hourB]) => parseInt(hourA) - parseInt(hourB))
    .map(([hour, statuses]) => ({
      hour,
      status10: statuses['10'] || 0,
      status31: statuses['31'] || 0,
      status35: statuses['35'] || 0,
      status40: statuses['40'] || 0,
      status50: statuses['50'] || 0,
    })) : [];

  // Prepare data for In Progress Only Chart
  const inProgressOnlyChartData = summary?.hourlyStatusSnapshots ? Object.entries(summary.hourlyStatusSnapshots)
    .sort(([hourA], [hourB]) => parseInt(hourA) - parseInt(hourB))
    .map(([hour, statuses]) => ({
      hour,
      status31: statuses['31'] || 0,
      status35: statuses['35'] || 0,
      status40: statuses['40'] || 0,
    })) : [];

  // Prepare data for Shipments Chart (statuses 50, 60, 70)
  const shipmentsChartData = summary?.hourlyStatusSnapshots ? Object.entries(summary.hourlyStatusSnapshots)
    .sort(([hourA], [hourB]) => parseInt(hourA) - parseInt(hourB))
    .map(([hour, statuses]) => ({
      hour,
      status50: statuses['50'] || 0,
      status60: statuses['60'] || 0,
      status70: statuses['70'] || 0,
    })) : [];

  // Data for "Orders Over Time" chart
  const ordersOverTimeData = Object.entries(summary?.byDay || {}).map(([date, stats]) => ({
    date: format(new Date(date), 'dd/MM/yyyy'),
    celkem: stats.total,
    hotovo: stats.done,
    "v procesu": stats.inProgress,
    zbývá: stats.remaining,
    nové: stats.newOrders,
  }));

  // Data for "Status Distribution" Pie Chart
  const statusPieData = Object.entries(summary?.statusCounts || {}).map(([status, count]) => ({
    name: `Status ${status}`,
    value: count,
  })).filter(item => item.value > 0);

  // Data for "Order Types" Pie Chart
  const deliveryTypePieData = Object.entries(summary?.deliveryTypes || {}).map(([type, count]) => ({
    name: type === "P" ? t.pallets : t.carton,
    value: count,
  })).filter(item => item.value > 0);

  // Data for Shift Comparison Chart
  const shiftComparisonData = summary?.shiftDoneCounts ? [
    { name: t.shift1Name, value: summary.shiftDoneCounts['1'] || 0 },
    { name: t.shift2Name, value: summary.shiftDoneCounts['2'] || 0 },
  ] : [];

  // Data for Stacked Status Chart by Date Category
  const statusStackedChartData = Object.keys(summary?.statusByDateCategory || {}).map(status => ({
    name: `Status ${status}`,
    ...summary.statusByDateCategory[status],
  }));

  // Data for Stacked Delivery Type Chart by Date Category
  const deliveryTypeStackedChartData = Object.keys(summary?.deliveryTypeByDateCategory || {}).map(type => ({
    name: type === 'P' ? t.pallets : t.carton,
    ...summary.deliveryTypeByDateCategory[type],
  }));

  // Get unique statuses and delivery types for filter dropdowns
  const uniqueStatuses = Array.from(new Set(rawExcelData.map(row => Number(row["Status"])).filter(s => !isNaN(s)))).sort((a, b) => a - b);
  const uniqueDeliveryTypes = Array.from(new Set(rawExcelData.map(row => row["del.type"]).filter(t => t))).sort();


  return (
    <div
      className={`p-8 space-y-8 min-h-screen ${
        darkMode ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"
      } transition-colors duration-300 font-inter`}
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">{t.title}</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setLang(prevLang => {
                if (prevLang === "cz") return "en";
                if (prevLang === "en") return "de";
                return "cz";
              });
            }}
            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg shadow text-sm"
          >
            <Globe className="w-4 h-4" /> {t.langCode}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg shadow text-sm"
          >
            {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />} {t.switchTheme}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg shadow text-sm"
          >
            <Lock className="w-5 h-5" /> {t.logout}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-center gap-4">
        <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow transition-colors">
          <UploadCloud className="w-5 h-5 text-white" />
          <span>{t.upload}</span>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition-colors"
        >
          <FileDown className="w-5 h-5" /> {t.export}
        </button>
      </div>

      {/* Search Functionality and Import History - side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col sm:flex-row items-center gap-4">
          <input
            type="text"
            placeholder={t.enterDeliveryNo}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            className="w-full sm:w-auto flex-grow p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition-colors w-full sm:w-auto justify-center"
          >
            <Search className="w-5 h-5" /> {t.searchDelivery}
          </button>
        </div>

        {importHistory.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <History className="w-5 h-5" /> {t.history}
            </h2>
            <div className="flex items-center gap-4">
              <select
                id="import-select"
                value={selectedImportId || ""}
                onChange={handleSelectImport}
                className="p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500 flex-grow"
              >
                <option value="">{t.selectImport}</option>
                {importHistory.map((imp) => (
                  <option key={imp.id} value={imp.id}>
                    {imp.date_label} - {imp.original_name}
                  </option>
                ))}
              </select>
              {selectedImportId && (
                <button
                  onClick={() => confirmDelete(selectedImportId)}
                  className="p-2 rounded-full text-red-400 hover:bg-red-900 transition-colors"
                  title="Smazat vybraný import"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search Result Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 bg-gray-800 rounded-lg shadow-xl text-center w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">{t.deliveryDetails}</h2>
            {searchResult ? (
              <div className="text-left space-y-2 text-gray-200">
                <p><strong>{t.deliveryNo}:</strong> {searchResult["Delivery"] || searchResult["Delivery No"]}</p>
                <p><strong>{t.status}:</strong> {searchResult["Status"]}</p>
                <p><strong>{t.deliveryType}:</strong> {searchResult["del.type"]}</p>
                <p><strong>{t.forwardingAgent}:</strong> {searchResult["Forwarding agent name"] || "N/A"}</p>
                <p><strong>{t.loadingDate}:</strong> {searchResult["Loading Date"] ? format(parseExcelDate(searchResult["Loading Date"]), 'dd/MM/yyyy') : "N/A"}</p>
                <p><strong>{t.shipToPartyName}:</strong> {searchResult["Name of ship-to party"] || "N/A"}</p>
                <p><strong>{t.totalWeight}:</strong> {searchResult["Total Weight"] || "N/A"}</p>
              </div>
            ) : (
              <p className="text-red-400">{t.deliveryNotFound}</p>
            )}
            <button
              onClick={() => setShowSearchModal(false)}
              className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t.close}
            </button>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 bg-gray-800 rounded-lg shadow-xl text-center">
            <p className="text-lg mb-4">{t.deleteConfirm}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDeleteImport}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                {t.yes}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                {t.no}
              </button>
            </div>
          </Card>
        </div>
      )}

      {!summary && (
        <p className="text-gray-400 text-center mt-8">{t.uploadFilePrompt}</p>
      )}

      {summary && (
        <div id="report-section" className="space-y-10">
          {/* Data Filters Section - compact and collapsible */}
          <Card className="bg-gray-800 p-4 rounded-xl shadow-lg">
            <h2
              className="text-xl font-semibold mb-3 text-gray-200 flex items-center gap-2 cursor-pointer"
              onClick={() => setFiltersCollapsed(!filtersCollapsed)}
            >
              <Search className="w-5 h-5" /> {t.filters}
              <span className="ml-auto text-sm">
                {filtersCollapsed ? '▼' : '▲'}
              </span>
            </h2>
            {!filtersCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="time-range-filter" className="block text-xs font-medium text-gray-400 mb-1">{t.timeRange}:</label>
                  <select
                    id="time-range-filter"
                    value={filterTimeRange}
                    onChange={(e) => {
                      setFilterTimeRange(e.target.value);
                      if (e.target.value !== 'custom') {
                        setFilterStartDate('');
                        setFilterEndDate('');
                      }
                    }}
                    className="w-full p-1.5 text-sm rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">{t.allTime}</option>
                    <option value="yesterday">{(format(subDays(startOfDay(new Date()), 1), 'dd/MM/yyyy'))}</option>
                    <option value="today">{format(startOfDay(new Date()), 'dd/MM/yyyy')}</option>
                    <option value="last7days">{t.last7Days}</option>
                    <option value="thisMonth">{t.thisMonth}</option>
                    <option value="custom">{t.customRange}</option>
                  </select>
                </div>

                {filterTimeRange === 'custom' && (
                  <>
                    <div>
                      <label htmlFor="start-date-filter" className="block text-xs font-medium text-gray-400 mb-1">Start Date:</label>
                      <input
                        type="date"
                        id="start-date-filter"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full p-1.5 text-sm rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="end-date-filter" className="block text-xs font-medium text-gray-400 mb-1">End Date:</label>
                      <input
                        type="date"
                        id="end-date-filter"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full p-1.5 text-sm rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="delivery-type-filter" className="block text-xs font-medium text-gray-400 mb-1">{t.filterByDeliveryType}:</label>
                  <select
                    id="delivery-type-filter"
                    value={filterDeliveryType}
                    onChange={(e) => setFilterDeliveryType(e.target.value)}
                    className="w-full p-1.5 text-sm rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All</option>
                    {uniqueDeliveryTypes.map(type => (
                      <option key={type} value={type}>{type === 'P' ? t.pallets : t.carton}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="status-filter" className="block text-xs font-medium text-gray-400 mb-1">{t.filterByStatus}:</label>
                  <select
                    id="status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-1.5 text-sm rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All</option>
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setFilterTimeRange('all');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setFilterDeliveryType('all');
                      setFilterStatus('all');
                    }}
                    className="bg-gray-600 text-white px-3 py-1.5 text-sm rounded-lg shadow hover:bg-gray-700 transition-colors"
                  >
                    {t.clearFilters}
                  </button>
                </div>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {Object.entries(summary.byDay).map(
              ([date, stats]) => (
                <Card key={date}>
                  <CardContent>
                    <h2 className="text-lg font-semibold text-blue-400 mb-2">
                      {format(new Date(date), 'dd/MM/yyyy')}
                    </h2>
                    <p className="text-gray-200">
                      {t.total}: <strong>{stats.total}</strong>
                    </p>
                    <p className="text-green-400">
                      {t.done}: <strong>{stats.done}</strong>
                    </p>
                    <p className="text-red-400">
                      {t.remaining}:{" "}
                      <strong>
                        {stats.remaining}
                      </strong>
                    </p>
                    <p className="text-yellow-400">
                      {t.inProgress}: <strong>{stats.inProgress}</strong>
                    </p>
                    <p className="text-blue-400">
                      {t.newOrders}: <strong>{stats.newOrders}</strong>
                    </p>
                    <p className="text-gray-200">
                      {t.pallets}: <strong>{stats.pallets}</strong>
                    </p>
                    <p className="text-gray-200">
                      {t.carton}: <strong>{stats.cartons}</strong>
                    </p>
                  </CardContent>
                </Card>
              )
            )}

            {/* Overall Statuses Card */}
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-green-400 flex items-center gap-1 mb-2">
                  <BarChart3 className="w-4 h-4" />{" "}
                  {t.statuses}
                </h2>
                {Object.entries(summary.statusCounts).length > 0 ? (
                  Object.entries(summary.statusCounts)
                    .sort(([sA], [sB]) => parseInt(sA) - parseInt(sB))
                    .map(([status, count]) => (
                      <p key={status} className="text-gray-200">
                        Status {status}:{" "}
                        <strong>{count}</strong>
                      </p>
                    ))
                ) : (
                  <p className="text-gray-400">N/A</p>
                )}
              </CardContent>
            </Card>

            {/* Delivery Types and Overall Delayed Orders Card */}
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-indigo-400 flex items-center gap-1 mb-2">
                  <TimerReset className="w-4 h-4" />{" "}
                  {t.types}
                </h2>
                {Object.entries(summary.deliveryTypes).length > 0 ? (
                  Object.entries(summary.deliveryTypes).map(
                    ([type, count]) => (
                      <p key={type} className="text-gray-200">
                        {type === "P" ? t.pallets : t.carton}:{" "}
                        <strong>{count}</strong>
                      </p>
                    )
                  )
                ) : (
                  <p className="text-gray-400">N/A</p>
                )}
                <p className="text-gray-200 pt-2">
                  {t.sentPallets}:{" "}
                  <strong>{summary.sentPallets}</strong>
                </p>
                <p className="text-gray-200">
                  {t.sentCartons}:{" "}
                  <strong>{summary.sentCartons}</strong>
                </p>
                <p className="text-red-400 pt-2 font-bold">
                  {t.delayed}:{" "}
                  <strong>{summary.delayed}</strong>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Delayed Orders List */}
          {summary.delayedOrdersList.length > 0 && (
            <Card>
              <CardContent>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-red-400">
                  <ClipboardList className="w-6 h-6" /> {t.delayed}
                </h2>
                <p className="text-gray-200 text-lg mb-4">
                  {t.totalDelayed}: <strong className="text-red-400">{summary.delayedOrdersList.length}</strong>
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                    <thead className="bg-gray-600">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.deliveryNo}</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.status}</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.deliveryType}</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.loadingDate}</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.delay}</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.note}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Display only 10 rows or all if expanded */}
                      {(showAllDelayed ? summary.delayedOrdersList : summary.delayedOrdersList.slice(0, 10)).map((order, index) => (
                        <tr key={index} className={`border-t border-gray-600 ${index % 2 === 0 ? "bg-gray-750" : "bg-gray-700"}`}>
                          <td className="py-3 px-4 text-gray-200">{order.delivery}</td>
                          <td className="py-3 px-4 text-gray-200">{order.status}</td>
                          <td className="py-3 px-4 text-gray-200">{order.delType}</td>
                          <td className="py-3 px-4 text-gray-200">{order.loadingDate}</td>
                          <td className={`py-3 px-4 font-semibold ${getDelayColorClass(order.delayDays)}`}>{order.delayDays}</td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={order.note}
                              onChange={(e) => {
                                const updatedList = [...summary.delayedOrdersList];
                                updatedList[index].note = e.target.value;
                                setSummary({ ...summary, delayedOrdersList: updatedList });
                              }}
                              className="w-full p-1 rounded-md bg-gray-600 border border-gray-500 text-gray-100 text-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder={t.note}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {summary.delayedOrdersList.length > 10 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setShowAllDelayed(!showAllDelayed)}
                      className="text-blue-400 hover:underline px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      {showAllDelayed ? t.showLess : `${t.showMore} (${summary.delayedOrdersList.length - 10} ${t.moreItems})`}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Shift and Hourly Overview */}
          {summary && (
            <Card>
              <CardContent>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-purple-400">
                  <TimerReset className="w-6 h-6" /> {t.hourlyOverview}
                </h2>
                <p className="text-gray-200 mb-4">
                  {t.currentShift}:{" "}
                  <strong>
                    {summary.currentShift ? `${t.shift} ${summary.currentShift}` : t.noShift}
                  </strong>
                </p>

                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-md">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={candlestickChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <XAxis
                        dataKey="hour"
                        stroke="#E5E7EB"
                        tick={{ fill: "#E5E7EB" }}
                        axisLine={{ stroke: "#4B5563" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#E5E7EB"
                        tick={{ fill: "#E5E7EB" }}
                        axisLine={{ stroke: "#4B5563" }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#E5E7EB' }}
                        itemStyle={{ color: '#E5E7EB' }}
                      />
                      <Legend wrapperStyle={{ color: '#E5E7EB', paddingTop: '10px' }} />
                      <Bar dataKey="status10" name="Status 10 (Nové)" fill={CHART_COLORS[0]} stackId="a">
                        <LabelList dataKey="status10" position="insideTop" fill="#E5E7EB" />
                      </Bar>
                      <Bar dataKey="status31" name="Status 31" fill={CHART_COLORS[9]} stackId="a">
                        <LabelList dataKey="status31" position="insideTop" fill="#E5E7EB" />
                      </Bar>
                      <Bar dataKey="status35" name="Status 35" fill={CHART_COLORS[10]} stackId="a">
                        <LabelList dataKey="status35" position="insideTop" fill="#E5E7EB" />
                      </Bar>
                      <Bar dataKey="status40" name="Status 40" fill={CHART_COLORS[11]} stackId="a">
                        <LabelList dataKey="status40" position="insideTop" fill="#E5E7EB" />
                      </Bar>
                      <Bar dataKey="status50" name="Status 50 (Hotovo)" fill={CHART_COLORS[4]} stackId="a">
                        <LabelList dataKey="status50" position="insideTop" fill="#E5E7EB" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}


          <div className="mt-10 space-y-10">
            {/* Orders Over Time Chart */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-400" />{" "}
                {t.ordersOverTime}
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => setChartTypeOrdersOverTime('bar')}
                    className={`p-2 rounded-full ${chartTypeOrdersOverTime === 'bar' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-blue-700 transition-colors`}
                    title={t.barChart}
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setChartTypeOrdersOverTime('line')}
                    className={`p-2 rounded-full ${chartTypeOrdersOverTime === 'line' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-blue-700 transition-colors`}
                    title={t.lineChart}
                  >
                    <LineChartIcon className="w-5 h-5" />
                  </button>
                </div>
              </h2>
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-md">
                <ResponsiveContainer width="100%" height={320}>
                  {chartTypeOrdersOverTime === 'bar' ? (
                    <BarChart
                      data={ordersOverTimeData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <XAxis dataKey="date" stroke="#E5E7EB" tick={{ fill: "#E5E7EB" }} axisLine={{ stroke: "#4B5563" }} />
                      <YAxis allowDecimals={false} stroke="#E5E7EB" tick={{ fill: "#E5E7EB" }} axisLine={{ stroke: "#4B5563" }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#E5E7EB' }}
                        itemStyle={{ color: '#E5E7EB' }}
                      />
                      <Legend wrapperStyle={{ color: '#E5E7EB', paddingTop: '10px' }} />
                      <Bar dataKey="celkem" name={t.total} fill="#FFFFFF" radius={[6, 6, 0, 0]} animationDuration={800}>
                        <LabelList dataKey="celkem" position="top" fill="#E5E7EB" />
                      </Bar>
                      <Bar dataKey="zbývá" name={t.remaining} fill={CHART_COLORS[1]} radius={[6, 6, 0, 0]} animationDuration={800}>
                        <LabelList dataKey="zbývá" position="top" fill="#E5E7EB" />
                      </Bar>
                      <Bar dataKey="nové" name={t.newOrders} fill={CHART_COLORS[2]} radius={[6, 6, 0, 0]} animationDuration={800}>
                        <LabelList dataKey="nové" position="top" fill="#E5E7EB" />
                      </Bar>
                      <Bar dataKey="v procesu" name={t.inProgress} fill={CHART_COLORS[3]} radius={[6, 6, 0, 0]} animationDuration={800}>
                        <LabelList dataKey="v procesu" position="top" fill="#E5E7EB" />
                      </Bar>
                      <Bar dataKey="hotovo" name={t.done} fill={CHART_COLORS[4]} radius={[6, 6, 0, 0]} animationDuration={800}>
                        <LabelList dataKey="hotovo" position="top" fill="#E5E7EB" />
                      </Bar>
                    </BarChart>
                  ) : (
                    <LineChart
                      data={ordersOverTimeData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <XAxis dataKey="date" stroke="#E5E7EB" tick={{ fill: "#E5E7EB" }} axisLine={{ stroke: "#4B5563" }} />
                      <YAxis allowDecimals={false} stroke="#E5E7EB" tick={{ fill: "#E5E7EB" }} axisLine={{ stroke: "#4B5563" }} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.3)' }}
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#E5E7EB' }}
                        itemStyle={{ color: '#E5E7EB' }}
                      />
                      <Legend wrapperStyle={{ color: '#E5E7EB', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="celkem" name={t.total} stroke="#FFFFFF" activeDot={{ r: 8 }} animationDuration={800} />
                      <Line type="monotone" dataKey="zbývá" name={t.remaining} stroke={CHART_COLORS[1]} activeDot={{ r: 8 }} animationDuration={800} />
                      <Line type="monotone" dataKey="nové" name={t.newOrders} stroke={CHART_COLORS[2]} activeDot={{ r: 8 }} animationDuration={800} />
                      <Line type="monotone" dataKey="v procesu" name={t.inProgress} stroke={CHART_COLORS[3]} activeDot={{ r: 8 }} animationDuration={800} />
                      <Line type="monotone" dataKey="hotovo" name={t.done} stroke={CHART_COLORS[4]} activeDot={{ r: 8 }} animationDuration={800} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* New Chart: In Progress Only (statuses 31, 35, 40) */}
            {inProgressOnlyChartData.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-orange-400" />{" "}
                  {t.inProgressOnly}
                </h2>
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-md">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={inProgressOnlyChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <XAxis
                        dataKey="hour"
                        stroke="#E5E7EB"
                        tick={{ fill: "#E5E7EB" }}
                        axisLine={{ stroke: "#4B5563" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#E5E7EB"
                        tick={{ fill: "#E5E7EB" }}
                        axisLine={{ stroke: "#4B5563" }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#E5E7EB' }}
                        itemStyle={{ color: '#E5E7EB' }}
                      />
                      <Legend wrapperStyle={{ color: '#E5E7EB', paddingTop: '10px' }} />
                      <Bar dataKey="status31" name="Status 31" fill={CHART_COLORS[9]} stackId="b">
                        <LabelList dataKey="status31" position="top" fill="#E5E7EB" />
                      </Bar>
                      <Bar dataKey="status35" name="Status 35" fill={CHART_COLORS[10]} stackId="b">
                        <LabelList dataKey="status35" position="top" fill="#E5E7EB" />
                      </Bar>
                      <Bar dataKey="status40" name="Status 40" fill={CHART_COLORS[11]} stackId="b">
                        <LabelList dataKey="status40" position="top" fill="#E5E7EB" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* New Chart: Shipments (statuses 50, 60, 70) */}
            {shipmentsChartData.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-green-400" />{" "}
                  {t.shipments}
                </h2>
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-md">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={shipmentsChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <XAxis
                        dataKey="hour"
                        stroke="#E5E7EB"
                        tick={{ fill: "#E5E7EB" }}
                        axisLine={{ stroke: "#4B5563" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#E5E7EB"
                        tick={{ fill: "#E5E7EB" }}
                        axisLine={{ stroke: "#4B5563" }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#E5E7EB' }}
                        itemStyle={{ color: '#E5E7EB' }}
                      />
                      <Legend wrapperStyle={{ color: '#E5E7EB', paddingTop: '10px' }} />
                      <Bar dataKey="status50" name="Status 50" fill={CHART_COLORS[4]} stackId="c">
                        <LabelList dataKey="status50" position="top" fill="#E5E7EB" />
                      </Bar>
                      <Bar dataKey="status60" name="Status 60" fill={CHART_COLORS[7]} stackId="c">
                        <LabelList dataKey="status60" position="top" fill="#E5E7EB" />
                      </Bar>
                      <Bar dataKey="status70" name="Status 70" fill={CHART_COLORS[8]} stackId="c">
                        <LabelList dataKey="status70" position="top" fill="#E5E7EB" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* New Chart: Shift Comparison (Hotovo) */}
            {shiftComparisonData.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-purple-400" />{" "}
                  {t.shiftComparison}
                </h2>
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-md">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={shiftComparisonData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <XAxis
                        dataKey="name"
                        stroke="#E5E7EB"
                        tick={{ fill: "#E5E7EB" }}
                        axisLine={{ stroke: "#4B5563" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#E5E7EB"
                        tick={{ fill: "#E5E7EB" }}
                        axisLine={{ stroke: "#4B5563" }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#E5E7EB' }}
                        itemStyle={{ color: '#E5E7EB' }}
                      />
                      <Bar dataKey="value" name={t.done} fill={CHART_COLORS[4]} radius={[6, 6, 0, 0]} animationDuration={800}>
                        <LabelList dataKey="value" position="top" fill="#E5E7EB" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Status Distribution Chart */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-400" />{" "}
                {t.statusDistribution}
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => setChartTypeStatusDistribution('bar')}
                    className={`p-2 rounded-full ${chartTypeStatusDistribution === 'bar' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-blue-700 transition-colors`}
                    title={t.barChart}
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setChartTypeStatusDistribution('pie')}
                    className={`p-2 rounded-full ${chartTypeStatusDistribution === 'pie' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-blue-700 transition-colors`}
                    title={t.pieChart}
                  >
                    <PieChartIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setChartTypeStatusDistribution('stackedBar')}
                    className={`p-2 rounded-full ${chartTypeStatusDistribution === 'stackedBar' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-blue-700 transition-colors`}
                    title={t.stackedBarChart}
                  >
                    <BarChart3 className="w-5 h-5 rotate-90" /> {/* Rotated icon for stacked */}
                  </button>
                </div>
              </h2>
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-md">
                <ResponsiveContainer width="100%" height={320}>
                  {chartTypeStatusDistribution === 'bar' ? (
                    <BarChart
                      data={statusPieData}
                    >
                      <XAxis
                        dataKey="name"
                        stroke="#E5E7EB"
                        tick={{ fill: "#E5E7EB" }}
                        axisLine={{ stroke: "#4B5563" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#E5E7EB"
                        tick={{ fill: "#E5E7EB" }}
                        axisLine={{ stroke: "#4B5563" }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#E5E7EB' }}
                        itemStyle={{ color: '#E5E7EB' }}
                      />
                      <Bar
                        dataKey="value"
                        name={t.total}
                        fill={CHART_COLORS[0]}
                        radius={[6, 6, 0, 0]}
                        animationDuration={800}
                      >
                        <LabelList dataKey="value" position="top" fill="#E5E7EB" />
                      </Bar>
                    </BarChart>
                  ) : chartTypeStatusDistribution === 'pie' ? (
                    <PieChart>
                      <Pie
                        activeIndex={activeIndexStatus}
                        activeShape={renderActiveShape}
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        onMouseEnter={onPieEnterStatus}
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#E5E7EB' }}
                        itemStyle={{ color: '#E5E7EB' }}
                      />
                      <Legend wrapperStyle={{ color: '#E5E7EB', paddingTop: '10px' }} />
                    </PieChart>
                  ) : ( // Stacked Bar Chart
                    <BarChart
                      data={statusStackedChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <XAxis dataKey="name" stroke="#E5E7EB" tick={{ fill: "#E5E7EB" }} axisLine={{ stroke: "#4B5563" }} />
                      <YAxis allowDecimals={false} stroke="#E5E7EB" tick={{ fill: "#E5E7EB" }} axisLine={{ stroke: "#4B5563" }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#E5E7EB' }}
                        itemStyle={{ color: '#E5E7EB' }}
                      />
                      <Legend wrapperStyle={{ color: '#E5E7EB', paddingTop: '10px' }} />
                      <Bar key="today-status" dataKey="Today" name="Dnes" fill={DATE_CATEGORY_COLORS['Today']} stackId="statusDate" />
                      <Bar key="yesterday-status" dataKey="Yesterday" name="Včera" fill={DATE_CATEGORY_COLORS['Yesterday']} stackId="statusDate" />
                      <Bar key="older-status" dataKey="Older" name="Starší" fill={DATE_CATEGORY_COLORS['Older']} stackId="statusDate" />
                      <Bar key="future-status" dataKey="Future" name="Budoucí" fill={DATE_CATEGORY_COLORS['Future']} stackId="statusDate" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Order Types Chart */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-400" />{" "}
                {t.orderTypes}
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => setChartTypeOrderTypes('bar')}
                    className={`p-2 rounded-full ${chartTypeOrderTypes === 'bar' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-blue-700 transition-colors`}
                    title={t.barChart}
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setChartTypeOrderTypes('pie')}
                    className={`p-2 rounded-full ${chartTypeOrderTypes === 'pie' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-blue-700 transition-colors`}
                    title={t.pieChart}
                  >
                    <PieChartIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setChartTypeOrderTypes('stackedBar')}
                    className={`p-2 rounded-full ${chartTypeOrderTypes === 'stackedBar' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-blue-700 transition-colors`}
                    title={t.stackedBarChart}
                  >
                    <BarChart3 className="w-5 h-5 rotate-90" /> {/* Rotated icon for stacked */}
                  </button>
                </div>
              </h2>
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-md">
                <ResponsiveContainer width="100%" height={320}>
                  {chartTypeOrderTypes === 'bar' ? (
                    <BarChart
                      data={deliveryTypePieData}
                    >
                      <XAxis
                        dataKey="name"
                        stroke="#E5E7EB"
                        tick={{ fill: "#E5E7EB" }}
                        axisLine={{ stroke: "#4B5563" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#E5E7EB"
                        tick={{ fill: "#E5E7EB" }}
                        axisLine={{ stroke: "#4B5563" }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#E5E7EB' }}
                        itemStyle={{ color: '#E5E7EB' }}
                      />
                      <Bar
                        dataKey="value"
                        name={t.total}
                        fill={CHART_COLORS[5]}
                        radius={[6, 6, 0, 0]}
                        animationDuration={800}
                      >
                        <LabelList dataKey="value" position="top" fill="#E5E7EB" />
                      </Bar>
                    </BarChart>
                  ) : chartTypeOrderTypes === 'pie' ? (
                    <PieChart>
                      <Pie
                        activeIndex={activeIndexDelivery}
                        activeShape={renderActiveShape}
                        data={deliveryTypePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        onMouseEnter={onPieEnterDelivery}
                      >
                        {deliveryTypePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#E5E7EB' }}
                        itemStyle={{ color: '#E5E7EB' }}
                      />
                      <Legend wrapperStyle={{ color: '#E5E7EB', paddingTop: '10px' }} />
                    </PieChart>
                  ) : ( // Stacked Bar Chart
                    <BarChart
                      data={deliveryTypeStackedChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <XAxis dataKey="name" stroke="#E5E7EB" tick={{ fill: "#E5E7EB" }} axisLine={{ stroke: "#4B5563" }} />
                      <YAxis allowDecimals={false} stroke="#E5E7EB" tick={{ fill: "#E5E7EB" }} axisLine={{ stroke: "#4B5563" }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#E5E7EB' }}
                        itemStyle={{ color: '#E5E7EB' }}
                      />
                      <Legend wrapperStyle={{ color: '#E5E7EB', paddingTop: '10px' }} />
                      <Bar key="today-delivery" dataKey="Today" name="Dnes" fill={DATE_CATEGORY_COLORS['Today']} stackId="deliveryDate" />
                      <Bar key="yesterday-delivery" dataKey="Yesterday" name="Včera" fill={DATE_CATEGORY_COLORS['Yesterday']} stackId="deliveryDate" />
                      <Bar key="older-delivery" dataKey="Older" name="Starší" fill={DATE_CATEGORY_COLORS['Older']} stackId="deliveryDate" />
                      <Bar key="future-delivery" dataKey="Future" name="Budoucí" fill={DATE_CATEGORY_COLORS['Future']} stackId="deliveryDate" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
