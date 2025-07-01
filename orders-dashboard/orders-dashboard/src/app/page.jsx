"use client";

import React, { useState, useEffect, useCallback } from "react";
// Importy pro práci s datumy a časy
import {
  format,
  isBefore,
  startOfDay,
  differenceInDays,
  getHours,
  subDays,
  startOfMonth,
  endOfMonth,
  isAfter,
  parseISO, // Přidáno pro parsování ISO dat z DB
  addDays // Přidáno pro snazší práci s daty
} from "date-fns";
// Importy pro grafy z Recharts
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
// Importy ikon z Lucide React
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
  XCircle, // Pro tlačítko zavřít v modalu
  List, // Pro ikonu seznamu zakázek
} from "lucide-react";

// Supabase Configuration
// Poznámka: V produkčním prostředí byste tyto klíče měli spravovat bezpečněji (např. přes proměnné prostředí).
const SUPABASE_URL = "https://ucgiatobbjnqertgtmsw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZ2lhdG9iYmpucWVydGd0bXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTg1MjgsImxpIjoiMjA2Njg5NDUyOH0.EgqlPh4VHPsmHEII1snAmSDAxzs";

// Globální instance Supabase klienta
let supabaseClient = null;

// Jednoduché Card komponenty pro konzistentní stylování (Tailwind CSS)
const Card = ({ children, className = "" }) => (
  <div className={`p-4 border border-gray-700 rounded-xl mb-4 bg-gray-800 shadow-xl ${className}`}>
    {children}
  </div>
);
const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 space-y-2 ${className}`}>{children}</div>
);

// Pomocná funkce pro parsování Excel datumů
// Přesunuto mimo komponentu, aby se zabránilo nekonečné smyčce aktualizací
const parseExcelDate = (excelDate) => {
  if (typeof excelDate === "number") {
    if (typeof window.XLSX === 'undefined' || typeof window.XLSX.SSF === 'undefined') {
      console.error("XLSX.SSF not loaded. Cannot parse Excel date number.");
      return null;
    }
    const parsed = window.XLSX.SSF.parse_date_code(excelDate);
    return new Date(parsed.y, parsed.m - 1, parsed.d);
  } else if (typeof excelDate === "string") {
    // Zkusí parsovat formáty dd/MM/yyyy, dd.MM.yyyy, dd-MM-yyyy
    const parts = excelDate.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (parts) {
      // Měsíc je 0-indexovaný v JavaScriptu
      return new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
    }
    // Fallback pro jiné string formáty, které Date() umí parsovat (např. ISO string z DB)
    try {
      const isoParsed = parseISO(excelDate);
      if (!isNaN(isoParsed.getTime())) return isoParsed;
    } catch (e) {
      // Fallback to direct Date constructor if ISO parsing fails
    }
    return new Date(excelDate);
  }
  return null;
};

// Helper function for getting current shift
// Přesunuto mimo komponentu pro stabilitu
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


// Translation object pro více jazyků (Čeština, Angličtina, Němčina)
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
    stackedBarChart: "Skládaný sloupcový graf",
    shiftComparison: "Srovnání směn (Hotovo)",
    shift1Name: "Ranní směna",
    shift2Name: "Odpolední směna",
    toggleFilters: "Filtry",
    noDataAvailable: "Žádná data k zobrazení.",
    statusHistory: "Historie stavů",
    processingTime: "Doba zpracování",
    exportToXLSX: "Export do XLSX",
    exportToCSV: "Export do CSV", // Nový překlad
    selectImportsToCompare: "Vyberte importy k porovnání",
    import1: "Import 1",
    import2: "Import 2",
    compare: "Porovnat",
    comparisonResults: "Výsledky porovnání",
    noComparisonSelected: "Vyberte dva importy k porovnání.",
    noChangesDetected: "Nebyly detekovány žádné změny stavů mezi vybranými importy.",
    transferCreated: "Přenos vytvořen",
    readyForPicking: "Zakázka připravena na pickování",
    picked: "Zakázka dopickovaná",
    packed: "Zakázka zabalena",
    readyForCarrier: "Zakázka připravena pro dopravce",
    onTheWay: "Zakázka na cestě k zákazníkovi",
    dashboardTab: "Dashboard",
    delayedOrdersTab: "Zpožděné zakázky",
    importComparisonTab: "Porovnání importů",
    orderSearchTab: "Vyhledávání zakázek", // Nový překlad
    orderList: "Seznam zakázek",
    orderListFor: "Seznam zakázek pro",
    new_order: "Nová zakázka (status",
    removed_order: "Odstraněná zakázka (status",
    orders: "zakázek",
    filterByNameOfShipToParty: "Filtrovat dle jména příjemce", // Nový překlad
    man: "MAN",
    daimler: "Daimler",
    volvo: "Volvo",
    iveco: "Iveco",
    scania: "Scania",
    daf: "DAF",
    searchOrders: "Vyhledat zakázky", // Nový překlad
    noOrdersFound: "Žádné zakázky nebyly nalezeny pro zadaná kritéria.", // Nový překlad
    billOfLading: "Nákladní list", // Nový překlad
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
    noDataAvailable: "No data available.",
    statusHistory: "Status History",
    processingTime: "Processing Time",
    exportToXLSX: "Export to XLSX",
    exportToCSV: "Export to CSV",
    selectImportsToCompare: "Select imports to compare",
    import1: "Import 1",
    import2: "Import 2",
    compare: "Compare",
    comparisonResults: "Comparison Results",
    noComparisonSelected: "Select two imports to compare.",
    noChangesDetected: "No status changes detected between selected imports.",
    transferCreated: "Transfer Created",
    readyForPicking: "Order Ready for Picking",
    picked: "Order Picked",
    packed: "Order Packed",
    readyForCarrier: "Order Ready for Carrier",
    onTheWay: "Order On the Way to Customer",
    dashboardTab: "Dashboard",
    delayedOrdersTab: "Delayed Orders",
    importComparisonTab: "Import Comparison",
    orderSearchTab: "Order Search",
    orderList: "Order List",
    orderListFor: "Order List for",
    new_order: "New order (status",
    removed_order: "Removed order (status",
    orders: "orders",
    filterByNameOfShipToParty: "Filter by Name of Ship-to Party",
    man: "MAN",
    daimler: "Daimler",
    volvo: "Volvo",
    iveco: "Iveco",
    scania: "Scania",
    daf: "DAF",
    searchOrders: "Search Orders",
    noOrdersFound: "No orders found for the given criteria.",
    billOfLading: "Bill of lading",
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
    noDataAvailable: "Keine Daten verfügbar.",
    statusHistory: "Statusverlauf",
    processingTime: "Bearbeitungszeit",
    exportToXLSX: "Als XLSX exportieren",
    exportToCSV: "Als CSV exportieren",
    selectImportsToCompare: "Importe zum Vergleich auswählen",
    import1: "Import 1",
    import2: "Import 2",
    compare: "Vergleichen",
    comparisonResults: "Vergleichsergebnisse",
    noComparisonSelected: "Wählen Sie zwei Importe zum Vergleich aus.",
    noChangesDetected: "Es wurden keine Statusänderungen zwischen den ausgewählten Importen erkannt.",
    transferCreated: "Übertragung erstellt",
    readyForPicking: "Auftrag zur Kommissionierung bereit",
    picked: "Auftrag kommissioniert",
    packed: "Auftrag verpackt",
    readyForCarrier: "Auftrag für Spediteur bereit",
    onTheWay: "Auftrag unterwegs zum Kunden",
    dashboardTab: "Dashboard",
    delayedOrdersTab: "Verspätete Aufträge",
    importComparisonTab: "Importvergleich",
    orderSearchTab: "Auftragssuche",
    orderList: "Seznam zakázek",
    orderListFor: "Seznam zakázek pro",
    new_order: "Neuer Auftrag (Status",
    removed_order: "Entfernter Auftrag (Status",
    orders: "Aufträge",
    filterByNameOfShipToParty: "Nach Name des Empfängers filtern",
    man: "MAN",
    daimler: "Daimler",
    volvo: "Volvo",
    iveco: "Iveco",
    scania: "Scania",
    daf: "DAF",
    searchOrders: "Aufträge suchen",
    noOrdersFound: "Keine Aufträge für die angegebenen Kriterien gefunden.",
    billOfLading: "Frachtbrief",
  },
};

// Definice konzistentní barevné palety pro grafy
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

// Barvy pro kategorie dat v skládaných grafech
const DATE_CATEGORY_COLORS = {
  'Today': '#3498DB',     // Blue
  'Yesterday': '#9B59B6', // Purple
  'Older': '#E74C3C',     // Red
  'Future': '#2ECC71',   // Green
};

// Mapování statusů na textové popisy pro porovnání importů
const STATUS_TRANSITIONS = {
  '10_to_31': 'transferCreated',
  '31_to_35': 'readyForPicking',
  '35_to_40': 'picked',
  '40_to_50': 'packed',
  '50_to_60': 'readyForCarrier',
  '60_to_70': 'onTheWay',
};


export default function ZakazkyDashboard() {
  const [lang, setLang] = useState("cz");
  const [darkMode, setDarkMode] = useState(true);
  const [rawExcelData, setRawExcelData] = useState([]); // Uchovává původní, nefiltrovaná data
  const [summary, setSummary] = useState(null); // Zpracovaná souhrnná data na základě aktuálních filtrů
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [importHistory, setImportHistory] = useState([]);
  const [selectedImportId, setSelectedImportId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState(null);
  const [showAllDelayed, setShowAllDelayed] = useState(false);
  // Deklarace isScriptsLoaded state
  const [isScriptsLoaded, setIsScriptsLoaded] = useState(false);
  
  // States for the new Order Search tab
  const [searchDeliveryNo, setSearchDeliveryNo] = useState("");
  const [searchLoadingDate, setSearchLoadingDate] = useState("");
  const [searchStatus, setSearchStatus] = useState("all");
  const [searchShipToPartyName, setSearchShipToPartyName] = useState("all");
  const [searchOrdersResult, setSearchOrdersResult] = useState([]);
  // const [showSearchOrdersModal, setShowSearchOrdersModal] = useState(false); // Replaced by selectedOrderDetails
  const [searchModalTitle, setSearchModalTitle] = useState("");


  // Stavy pro filtry
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [filterTimeRange, setFilterTimeRange] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDeliveryType, setFilterDeliveryType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Stavy pro typy grafů (pro přepínání)
  const [chartTypeOrdersOverTime, setChartTypeOrdersOverTime] = useState('stackedBar'); // Změněno na 'stackedBar'
  const [chartTypeOrderTypes, setChartTypeOrderTypes] = useState('bar');

  // Stavy pro modální okno se seznamem zakázek (po kliknutí na karty)
  const [showOrderListModal, setShowOrderListModal] = useState(false);
  const [modalOrders, setModalOrders] = useState([]);
  const [modalTitle, setModalTitle] = useState('');

  // Stavy pro modální okno historie statusů
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);
  const [currentDeliveryNo, setCurrentDeliveryNo] = useState(null);
  const [deliveryStatusLog, setDeliveryStatusLog] = useState([]);

  // Stavy pro porovnání importů
  const [activeTab, setActiveTab] = useState(0); // 0: Dashboard, 1: Zpožděné, 2: Porovnání, 3: Vyhledávání zakázek

  const [compareImport1Id, setCompareImport1Id] = useState('');
  const [compareImport2Id, setCompareImport2Id] = useState('');
  const [comparisonResults, setComparisonResults] = useState([]);


  // Nový stav pro zobrazení detailů jedné zakázky v modalu
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);


  const t = translations[lang]; // Objekt pro překlady

  // Dynamické načítání externích skriptů (XLSX, jsPDF, html2canvas, Supabase JS)
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

    // Načítání Supabase JS jako první, protože je potřeba pro inicializaci klienta
    loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', 'supabase-js-script', () => {
      console.log('Supabase JS loaded');
      if (window.supabase && !supabaseClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
      }
      // Po načtení Supabase JS načteme ostatní skripty
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'xlsx-script', () => {
        console.log('XLSX loaded');
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf-script', () => {
          console.log('jsPDF loaded');
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas-script', () => {
            console.log('html2canvas loaded');
            setIsScriptsLoaded(true); // Set true when all essential scripts are loaded
          });
        });
      });
    });
    return () => {
      // Cleanup skriptů, pokud je potřeba (např. při odmontování komponenty)
      // Pro jednoduchost zde není implementováno, ale v komplexní aplikaci by bylo vhodné
    };
  }, []); // Prázdné pole závislostí zajistí, že se spustí pouze jednou při mountu


  // Hlavní logika zpracování dat (nyní přijímá již filtrované řádky)
  const processData = useCallback((rows) => {
    const now = new Date();
    const today = startOfDay(now);
    const currentShift = getCurrentShift(now);

    // Dny pro souhrnné karty (Včera, Dnes, Zítra, Pozítří)
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
      statusByDateCategory: {}, // Původní pro skládaný status graf (Today, Yesterday...)
      deliveryTypeByDateCategory: {}, // Původní pro skládaný typ dodávky graf (Today, Yesterday...)
      statusByLoadingDate: {}, // Nové pro skládaný status graf s Loading Date na X-ose
    };

    // Inicializace hodinových snapshotů pro dnešek (00:00 do 23:00)
    // Zde rozšířeno na celý den pro robustnost, i když graf může zobrazovat jen část
    for (let h = 0; h <= 23; h++) {
      const hourKey = format(new Date(today.getFullYear(), today.getMonth(), today.getDate(), h), 'HH'); // Použijeme jen hodinu jako klíč
      result.hourlyStatusSnapshots[hourKey] = {
        '10': 0, '31': 0, '35': 0, '40': 0, '50': 0, '60': 0, '70': 0,
      };
    }

    const doneStatuses = [50, 60, 70];
    const remainingStatuses = [10, 31, 35, 40];
    const inProgressStatuses = [31, 35, 40];
    const newOrderStatuses = [10];
    const sentStatuses = [60, 70];

    // Inicializace byDay pro pevné offsety
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
      // Používáme "Delivery" nebo "Delivery No" s trim() pro konzistenci
      const deliveryIdentifier = (row["Delivery"] || row["Delivery No"])?.trim(); 

      if (!loadingDate || isNaN(status) || !deliveryIdentifier) return; // Přidána kontrola deliveryIdentifier

      const parsedDate = parseExcelDate(loadingDate);

      if (parsedDate === null || isNaN(parsedDate.getTime())) {
        console.warn(`Invalid Loading Date for row: ${JSON.stringify(row)}`);
        return;
      }

      const formattedDate_YYYYMMDD = format(parsedDate, "yyyy-MM-dd");
      const formattedDate_DDMMYYYY = format(parsedDate, "dd/MM/yyyy");

      // Určení kategorie data pro skládané grafy (Today, Yesterday, Older, Future)
      let dateCategoryName;
      if (formattedDate_YYYYMMDD === todayDateStr) {
        dateCategoryName = 'Today';
      } else if (formattedDate_YYYYMMDD === yesterdayDateStr) {
        dateCategoryName = 'Yesterday';
      } else if (isBefore(parsedDate, today)) {
        dateCategoryName = 'Older';
      } else if (isAfter(parsedDate, today)) { // Kontrola, zda je v budoucnosti
        dateCategoryName = 'Future';
      } else {
        dateCategoryName = 'Other'; // Fallback pro jakýkoli jiný případ
      }

      // Agregace pro statusByDateCategory (pro zachování původního grafu, pokud by byl potřeba)
      if (!result.statusByDateCategory[status]) {
        result.statusByDateCategory[status] = { 'Today': 0, 'Yesterday': 0, 'Older': 0, 'Future': 0 };
      }
      if (result.statusByDateCategory[status][dateCategoryName] !== undefined) {
          result.statusByDateCategory[status][dateCategoryName]++;
      }

      // Agregace pro deliveryTypeByDateCategory
      if (!result.deliveryTypeByDateCategory[delType]) {
        result.deliveryTypeByDateCategory[delType] = { 'Today': 0, 'Yesterday': 0, 'Older': 0, 'Future': 0 };
      }
      if (result.deliveryTypeByDateCategory[delType][dateCategoryName] !== undefined) {
          result.deliveryTypeByDateCategory[delType][dateCategoryName]++;
      }

      // NOVÁ agregace pro statusByLoadingDate (pro graf s Loading Date na X-ose)
      if (!result.statusByLoadingDate[formattedDate_YYYYMMDD]) {
        result.statusByLoadingDate[formattedDate_YYYYMMDD] = { date: formattedDate_DDMMYYYY };
      }
      result.statusByLoadingDate[formattedDate_YYYYMMDD][`status${status}`] =
        (result.statusByLoadingDate[formattedDate_YYYYMMDD][`status${status}`] || 0) + 1;


      // Agregace pro byDay karty (pevné pro včera, dnes, zítra atd.)
      if (result.byDay[formattedDate_YYYYMMDD]) {
        result.byDay[formattedDate_YYYYMMDD].total += 1;
        if (doneStatuses.includes(status)) result.byDay[formattedDate_YYYYMMDD].done += 1;
        if (remainingStatuses.includes(status)) result.byDay[formattedDate_YYYYMMDD].remaining += 1;
        if (inProgressStatuses.includes(status)) result.byDay[formattedDate_YYYYMMDD].inProgress += 1;
        if (newOrderStatuses.includes(status)) result.byDay[formattedDate_YYYYMMDD].newOrders += 1;
        if (delType === "P") result.byDay[formattedDate_YYYYMMDD].pallets += 1;
        if (delType === "K") result.byDay[formattedDate_YYYYMMDD].cartons += 1;
      }

      // Celkové souhrnné počty (aplikují se na filtrovanou datovou sadu)
      if (doneStatuses.includes(status)) {
        result.doneTotal += 1;

        // Určení směny pro hotové objednávky pro graf porovnání směn
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

      // Zpožděné zakázky
      if (isBefore(parsedDate, today) && !doneStatuses.includes(status)) {
        result.delayed += 1;
        const delayDays = differenceInDays(today, parsedDate);
        result.delayedOrdersList.push({
          delivery: deliveryIdentifier, status: status, delType: delType,
          loadingDate: formattedDate_DDMMYYYY, delayDays: delayDays,
          note: row["Note"] || "", // Zajištění, že poznámka je z raw dat
          // Přidáme další potřebná pole pro zobrazení v modalu
          "Forwarding agent name": row["Forwarding agent name"],
          "Name of ship-to party": row["Name of ship-to party"],
          "Total Weight": row["Total Weight"],
          "Bill of lading": row["Bill of lading"] || "", // Přidáno pole "Bill of lading"
        });
      }

      if (!isNaN(status)) {
        result.statusCounts[status] = (result.statusCounts[status] || 0) + 1;
      }
      if (delType) {
        result.deliveryTypes[delType] = (result.deliveryTypes[delType] || 0) + 1;
      }

      // Hodinové status snapshoty pro *aktuální den zpracovaných dat*
      // Používáme jen hodinu jako klíč (HH)
      if (format(parsedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        const hourKey = format(parsedDate, 'HH');
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
  }, []); // parseExcelDate a getCurrentShift jsou nyní externí, takže zde nejsou potřeba

  // Funkce pro aplikaci všech filtrů a následné zpracování dat
  const applyFiltersAndProcessData = useCallback((dataToFilter) => {
    let currentFilteredRows = [...dataToFilter];
    const now = new Date();
    const today = startOfDay(now);

    // 1. Aplikace filtru časového rozsahu
    let tempStartDate = null;
    let tempEndDate = null;

    if (filterTimeRange === 'yesterday') {
      tempStartDate = subDays(today, 1);
      tempEndDate = today; // Až do začátku dneška
    } else if (filterTimeRange === 'today') {
      tempStartDate = today;
      tempEndDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1); // Až do začátku zítřka
    } else if (filterTimeRange === 'last7days') {
      tempStartDate = subDays(today, 6); // Zahrnuje dnešek
      tempEndDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    } else if (filterTimeRange === 'thisMonth') {
      tempStartDate = startOfMonth(today);
      tempEndDate = endOfMonth(today);
      tempEndDate.setDate(tempEndDate.getDate() + 1); // Zahrnout konec měsíce
    } else if (filterTimeRange === 'custom' && filterStartDate && filterEndDate) {
      tempStartDate = startOfDay(new Date(filterStartDate));
      tempEndDate = startOfDay(new Date(filterEndDate));
      tempEndDate.setDate(tempEndDate.getDate() + 1); // Zahrnout konečný den
    }

    if (filterTimeRange !== 'all') {
      currentFilteredRows = currentFilteredRows.filter(row => {
        const parsedDate = parseExcelDate(row["Loading Date"]);
        if (parsedDate === null || isNaN(parsedDate.getTime())) return false;
        return parsedDate >= tempStartDate && parsedDate < tempEndDate;
      });
    }

    // 2. Aplikace filtru typu dodávky
    if (filterDeliveryType !== 'all') {
      currentFilteredRows = currentFilteredRows.filter(row => row["del.type"] === filterDeliveryType);
    }

    // 3. Aplikace filtru statusu
    if (filterStatus !== 'all') {
      currentFilteredRows = currentFilteredRows.filter(row => Number(row["Status"]) === Number(filterStatus));
    }

    return processData(currentFilteredRows);
  }, [filterTimeRange, filterStartDate, filterEndDate, filterDeliveryType, filterStatus, processData]);

  // Efekt pro opětovné aplikování filtrů, když se změní stav filtrů nebo rawExcelData
  useEffect(() => {
    // Only process data if scripts are loaded and rawExcelData exists
    if (isScriptsLoaded && rawExcelData.length > 0) {
      setSummary(applyFiltersAndProcessData(rawExcelData));
    } else if (rawExcelData.length === 0 && summary !== null) { // Pouze vyčistí, pokud summary není již null
      setSummary(null);
    }
  }, [rawExcelData, applyFiltersAndProcessData, isScriptsLoaded]); // Ponecháno isScriptsLoaded v závislostech

  // Načtení historie importů ze Supabase při mountu (po autentizaci a připravenosti supabaseClient)
  useEffect(() => {
    const fetchHistory = async () => {
      if (isAuthenticated && supabaseClient) { // supabaseClient je nyní v závislostech
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
              // Nastavíme poslední import jako výchozí
              setSelectedImportId(data[0].id);
              // Načteme data pro tento import
              const { data: fetchedImportData, error: fetchImportError } = await supabaseClient
                .from("imports")
                .select("data")
                .eq("id", data[0].id)
                .single();
              if (fetchImportError) {
                console.error("Error fetching data for latest import:", fetchImportError);
                setRawExcelData([]);
              } else {
                setRawExcelData(fetchedImportData.data);
              }
            }
          }
        } catch (e) {
          console.error("Caught error fetching import history:", e);
        }
      }
    };
    // Spustí fetchHistory pouze pokud je supabaseClient inicializován
    if (supabaseClient) {
      fetchHistory();
    }
  }, [isAuthenticated, supabaseClient]); // Přidáno supabaseClient do závislostí

  // Autentizace (zjednodušená pro "Admin")
  const handleLogin = () => {
    if (username === "Admin" && password === "Admin") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError(t.loginError);
    }
  };

  // Odhlášení
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    setSummary(null);
    setRawExcelData([]);
    setImportHistory([]);
    setSelectedImportId(null);
    setSearchOrdersResult([]); // Clear search results on logout
    setSelectedOrderDetails(null); // Clear selected order details on logout
  };

  // Funkce pro logování změn statusů do delivery_status_log a aktualizaci deliveries
  const logStatusChanges = async (newImportData, importId) => {
    if (!supabaseClient) {
      console.warn("Supabase client not initialized for status logging.");
      return;
    }

    try {
      // Načtení aktuálních statusů ze Supabase pro porovnání
      const { data: currentDeliveries, error: fetchError } = await supabaseClient
        .from("deliveries")
        .select('"Delivery No", "Status"');

      if (fetchError) {
        console.error("Error fetching current deliveries for status log:", fetchError.message);
        // Pokračujeme dál, i když se nepodařilo načíst aktuální dodávky
      }
      const currentDeliveriesMap = new Map(currentDeliveries?.map(d => [d["Delivery No"], d.Status]) || []);

      const statusLogEntries = [];
      const upsertPromises = [];

      for (const row of newImportData) {
        // Používáme "Delivery" nebo "Delivery No" s trim() pro konzistenci
        const deliveryIdentifier = (row["Delivery"] || row["Delivery No"])?.trim();
        const newStatus = Number(row["Status"]);
        const loadingDate = parseExcelDate(row["Loading Date"]);

        if (!deliveryIdentifier || isNaN(newStatus) || !loadingDate) {
          console.warn(`Skipping row due to missing/invalid data: ${JSON.stringify(row)}`);
          continue;
        }

        const existingStatus = currentDeliveriesMap.get(deliveryIdentifier);

        // Vložíme nebo aktualizujeme hlavní tabulku 'deliveries'
        upsertPromises.push(
          supabaseClient.from("deliveries").upsert(
            {
              "Delivery No": deliveryIdentifier, // Mapujeme na "Delivery No" v DB
              "Status": newStatus,
              "del.type": row["del.type"],
              "Loading Date": loadingDate.toISOString(),
              "Forwarding agent name": row["Forwarding agent name"],
              "Name of ship-to party": row["Name of ship-to party"],
              "Total Weight": row["Total Weight"],
              "Note": row["Note"] || null, // Uložíme i poznámku
              "Bill of lading": row["Bill of lading"] || null, // Uložíme i "Bill of lading"
              last_imported_at: new Date().toISOString(),
              source_import_id: importId,
            },
            { onConflict: '"Delivery No"' }
          )
        );

        // Logování změny statusu
        if (existingStatus === undefined) {
          // Nová dodávka, logujeme počáteční status
          statusLogEntries.push({
            delivery_no: deliveryIdentifier, // Mapujeme na delivery_no v logu
            status: newStatus,
            timestamp: new Date().toISOString(),
            source_import: importId,
          });
        } else if (existingStatus !== newStatus) {
          // Status se změnil, logujeme nový status
          statusLogEntries.push({
            delivery_no: deliveryIdentifier, // Mapujeme na delivery_no v logu
            status: newStatus,
            timestamp: new Date().toISOString(),
            source_import: importId,
          });
        }
      }

      // Spustíme všechny upsert operace pro tabulku 'deliveries'
      await Promise.all(upsertPromises);

      // Vložíme nové záznamy do delivery_status_log
      if (statusLogEntries.length > 0) {
        const { error: logError } = await supabaseClient.from("delivery_status_log").insert(statusLogEntries);
        if (logError) {
          console.error("Error logging status changes:", logError.message);
        } else {
          console.log(`Logged ${statusLogEntries.length} status changes.`);
        }
      }

    } catch (e) {
      console.error("Caught error during status logging:", e);
    }
  };


  // Handler pro nahrání souboru
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

      // Před uložením do Supabase a zpracováním dat, uložíme rawExcelData
      setRawExcelData(jsonData);

      if (supabaseClient) {
        try {
          // Uložíme metadata importu a samotná data do tabulky 'imports'
          const { data: savedImport, error: importError } = await supabaseClient.from("imports").insert([
            {
              created_at: new Date().toISOString(),
              original_name: file.name,
              data: jsonData, // Uložíme celá JSON data
              date_label: format(new Date(), "dd/MM/yyyy HH:mm"),
            },
          ]).select('id, created_at, original_name, date_label');

          if (importError) {
            console.error("Error saving import metadata and data to Supabase:", importError);
            return;
          }

          const newImportId = savedImport[0].id;

          // Nyní logujeme statusy a aktualizujeme hlavní tabulku dodávek
          await logStatusChanges(jsonData, newImportId);

          // Aktualizujeme historii importů v UI
          setImportHistory(prevHistory => [savedImport[0], ...prevHistory]);
          setSelectedImportId(newImportId); // Nastavíme nově nahraný import jako vybraný

        } catch (e) {
          console.error("Caught error during file upload and saving to Supabase:", e);
        }
      } else {
        console.warn("Supabase client not initialized. Data will not be saved to DB.");
      }
    };

    reader.readAsBinaryString(file);
  };

  // Handler pro výběr importu z historie
  const handleSelectImport = async (e) => {
    const id = e.target.value;
    setSelectedImportId(id);
    if (id && supabaseClient) {
      try {
        // Načteme data z tabulky 'imports'
        const { data: fetchedImport, error } = await supabaseClient
          .from("imports")
          .select("data")
          .eq("id", id)
          .single(); // Použijeme single, protože očekáváme jeden záznam

        if (error) {
          console.error("Error fetching selected import data:", error);
          setSummary(null);
          setRawExcelData([]);
        } else {
          // Supabase uloží data jako JSONB, která se načtou jako JS objekt/pole
          setRawExcelData(fetchedImport.data);
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

  // Potvrzení smazání importu
  const confirmDelete = (id) => {
    setItemToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  // Smazání importu
  const handleDeleteImport = async () => {
    if (!itemToDeleteId || !supabaseClient) return;

    try {
      // Smažeme záznamy z delivery_status_log, které odkazují na tento import
      const { error: logDeleteError } = await supabaseClient
        .from("delivery_status_log")
        .delete()
        .eq("source_import", itemToDeleteId);

      if (logDeleteError) {
        console.error("Error deleting associated status logs:", logDeleteError);
        // Můžeme se rozhodnout, zda pokračovat, nebo zastavit
      }

      // Smažeme záznamy z hlavní tabulky 'deliveries', které byly naposledy aktualizovány tímto importem
      // Toto je složitější, protože dodávka mohla být aktualizována i jiným importem.
      // Pro jednoduchost smažeme jen import metadata. Pokud chcete smazat i dodávky,
      // museli byste implementovat složitější logiku, aby se smazaly jen ty dodávky,
      // které byly POUZE v tomto importu, nebo ty, které by po smazání neměly žádný platný status.
      // Pro účely tohoto příkladu smažeme jen záznam o importu a logy.
      const { error: importDeleteError } = await supabaseClient
        .from("imports")
        .delete()
        .eq("id", itemToDeleteId);

      if (importDeleteError) {
        console.error("Error deleting import:", importDeleteError);
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

  // Export do PDF (využívá html2canvas a jsPDF)
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


  // Funkce pro získání barvy zpoždění
  const getDelayColorClass = (delayDays) => {
    if (delayDays <= 1) return "text-green-400";
    if (delayDays <= 2) return "text-orange-400";
    return "text-red-400";
  };

  // Pomocná funkce pro formátování data na والصلاه-MM-DD
  function formatDate(dateInput) {
    if (!dateInput) return "";
    try {
      const date = typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  }

  // Funkce pro uložení poznámky do Supabase
  const handleSaveNote = useCallback(async (deliveryNo, newNote) => {
    if (!supabaseClient) {
      console.error("Supabase client not initialized for saving note.");
      return;
    }
    try {
      const { error } = await supabaseClient
        .from('deliveries')
        .update({ Note: newNote })
        .eq('"Delivery No"', deliveryNo.trim());

      if (error) {
        console.error("Error saving note:", error.message);
      } else {
        console.log(`Note for delivery ${deliveryNo} saved successfully.`);
        // Optionally, re-fetch data or update local state to reflect the change
        // For simplicity, we'll just log success.
      }
    } catch (e) {
      console.error("Caught error during saving note:", e);
    }
  }, [supabaseClient]);


  // Funkce pro vyhledávání dodávky a načtení historie statusů (původní Search, nyní pro Order Search tab)
  const handleSearchOrders = useCallback(() => {
    // Přidána ochrana proti chybě TypeError: null is not iterable
    if (!Array.isArray(rawExcelData) || rawExcelData === null) {
      setSearchOrdersResult([]);
      return;
    }

    const filtered = rawExcelData.filter((row) => {
      const deliveryMatch = searchDeliveryNo
        ? (row["Delivery"] || row["Delivery No"] || "").toLowerCase().includes(searchDeliveryNo.toLowerCase().trim())
        : true;

      const loadingDateMatch = searchLoadingDate
        ? formatDate(row["Loading Date"]) === searchLoadingDate
        : true;

      const statusMatch = searchStatus !== "all"
        ? String(row["Status"]) === String(searchStatus)
        : true;

      const partyMatch = searchShipToPartyName !== "all"
        ? (row["Name of ship-to party"] || "").toLowerCase().includes(searchShipToPartyName.toLowerCase())
        : true;

      return deliveryMatch && loadingDateMatch && statusMatch && partyMatch;
    });

    // Map filtered results to the format expected by OrderListTable and OrderDetailsModal
    const mappedResults = filtered.map(order => ({
      "Delivery No": (order["Delivery"] || order["Delivery No"])?.trim(),
      "Status": Number(order.Status),
      "del.type": order["del.type"],
      "Loading Date": order["Loading Date"],
      "Note": order["Note"] || "",
      "Forwarding agent name": order["Forwarding agent name"] || "N/A",
      "Name of ship-to party": order["Name of ship-to party"] || "N/A",
      "Total Weight": order["Total Weight"] || "N/A",
      "Bill of lading": order["Bill of lading"] || "N/A", // Přidáno "Bill of lading"
      "processingTime": "N/A", // Since we are not fetching from DB here, set to N/A
    }));

    setSearchOrdersResult(mappedResults);
  }, [rawExcelData, searchDeliveryNo, searchLoadingDate, searchStatus, searchShipToPartyName]);


  // Pie chart aktivní tvar pro hover efekt
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

  // Příprava dat pro Candlestick Chart (Hourly Overview)
  // Filtrujeme jen hodiny, které mají nějaká data
  const candlestickChartData = summary?.hourlyStatusSnapshots ? Object.entries(summary.hourlyStatusSnapshots)
    .filter(([, statuses]) => Object.values(statuses).some(count => count > 0)) // Filtrujeme prázdné hodiny
    .sort(([hourA], [hourB]) => parseInt(hourA) - parseInt(hourB))
    .map(([hour, statuses]) => ({
      hour: `${hour}:00`, // Formátujeme hodinu pro zobrazení
      status10: statuses['10'] || 0,
      status31: statuses['31'] || 0,
      status35: statuses['35'] || 0,
      status40: statuses['40'] || 0,
      status50: statuses['50'] || 0,
      status60: statuses['60'] || 0,
      status70: statuses['70'] || 0,
    })) : [];

  // Příprava dat pro In Progress Only Chart
  const inProgressOnlyChartData = summary?.hourlyStatusSnapshots ? Object.entries(summary.hourlyStatusSnapshots)
    .filter(([, statuses]) => (statuses['31'] || 0) + (statuses['35'] || 0) + (statuses['40'] || 0) > 0) // Filtrujeme prázdné hodiny
    .sort(([hourA], [hourB]) => parseInt(hourA) - parseInt(hourB))
    .map(([hour, statuses]) => ({
      hour: `${hour}:00`,
      status31: statuses['31'] || 0,
      status35: statuses['35'] || 0,
      status40: statuses['40'] || 0,
    })) : [];

  // Příprava dat pro Shipments Chart (statuses 50, 60, 70)
  const shipmentsChartData = summary?.hourlyStatusSnapshots ? Object.entries(summary.hourlyStatusSnapshots)
    .filter(([, statuses]) => (statuses['50'] || 0) + (statuses['60'] || 0) + (statuses['70'] || 0) > 0) // Filtrujeme prázdné hodiny
    .sort(([hourA], [hourB]) => parseInt(hourA) - parseInt(hourB))
    .map(([hour, statuses]) => ({
      hour: `${hour}:00`,
      status50: statuses['50'] || 0,
      status60: statuses['60'] || 0,
      status70: statuses['70'] || 0,
    })) : [];

  // Data pro "Orders Over Time" chart
  const ordersOverTimeData = Object.entries(summary?.byDay || {}).map(([date, stats]) => ({
    date: format(new Date(date), 'dd/MM/yyyy'),
    celkem: stats.total,
    hotovo: stats.done,
    "v procesu": stats.inProgress,
    zbývá: stats.remaining,
    nové: stats.newOrders,
  }));

  // Data pro "Status Distribution" Pie Chart
  const statusPieData = Object.entries(summary?.statusCounts || {}).map(([status, count]) => ({
    name: `Status ${status}`,
    value: count,
  })).filter(item => item.value > 0);

  // Data pro "Order Types" Pie Chart
  const deliveryTypePieData = Object.entries(summary?.deliveryTypes || {}).map(([type, count]) => ({
    name: type === "P" ? t.pallets : t.carton,
    value: count,
  })).filter(item => item.value > 0);

  // Data pro Shift Comparison Chart
  const shiftComparisonData = summary?.shiftDoneCounts ? [
    { name: t.shift1Name, value: summary.shiftDoneCounts['1'] || 0 },
    { name: t.shift2Name, value: summary.shiftDoneCounts['2'] || 0 },
  ] : [];

  // Data pro Stacked Status Chart by Date Category (původní)
  const statusStackedChartDataOld = Object.keys(summary?.statusByDateCategory || {})
    .map(status => ({
      name: `Status ${status}`,
      ...summary.statusByDateCategory[status],
    }))
    .filter(item => Object.values(item).some((val, key) => key !== 'name' && val > 0));

  // NOVÁ data pro Stacked Status Chart by Loading Date
  // Převedeme objekt statusByLoadingDate na pole pro Recharts
  const statusStackedChartData = Object.values(summary?.statusByLoadingDate || {})
    .sort((a, b) => {
      // Parse "dd/MM/yyyy" to Date objects for comparison
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      return dateA - dateB;
    });


  // Data pro Stacked Delivery Type Chart by Date Category
  const deliveryTypeStackedChartData = Object.keys(summary?.deliveryTypeByDateCategory || {})
    .map(type => ({
      name: type === 'P' ? t.pallets : t.carton,
      ...summary.deliveryTypeByDateCategory[type],
    }))
    .filter(item => Object.values(item).some((val, key) => key !== 'name' && val > 0));


  // Získání unikátních statusů a typů dodávek pro dropdown filtry
  const uniqueStatuses = Array.from(new Set(rawExcelData.map(row => Number(row["Status"])).filter(s => !isNaN(s)))).sort((a, b) => a - b);
  const uniqueDeliveryTypes = Array.from(new Set(rawExcelData.map(row => row["del.type"]).filter(t => t))).sort();

  // Funkce pro načtení a zobrazení seznamu zakázek v modalu
  const handleCardClick = useCallback(async (category, statusFilterArray = [], deliveryTypeFilter = null, selectedDateString = null) => {
    setModalTitle(t.orderListFor + " " + t[category]);

    let filteredOrders = rawExcelData;

    // Apply date filter first if a specific date is provided
    if (selectedDateString) {
        filteredOrders = filteredOrders.filter(order => {
            const parsedOrderDate = parseExcelDate(order["Loading Date"]);
            return parsedOrderDate && format(parsedOrderDate, 'yyyy-MM-dd') === selectedDateString;
        });
    }

    if (statusFilterArray.length > 0) {
      filteredOrders = filteredOrders.filter(order => statusFilterArray.includes(Number(order.Status)));
    } else if (category === 'delayed') {
      const today = startOfDay(new Date());
      filteredOrders = filteredOrders.filter(order => {
        const parsedDate = parseExcelDate(order["Loading Date"]);
        return parsedDate && isBefore(parsedDate, today) && ![50, 60, 70].includes(Number(order.Status));
      });
    } else if (deliveryTypeFilter) {
      filteredOrders = filteredOrders.filter(order => order["del.type"] === deliveryTypeFilter);
    }
    // Pro 'total' se neaplikuje žádný další filtr, použijí se všechna rawExcelData (již filtrovaná podle data, pokud je selectedDateString přítomen)

    const mappedOrders = filteredOrders.map(order => ({
      "Delivery No": (order["Delivery"] || order["Delivery No"])?.trim(),
      "Status": Number(order.Status),
      "del.type": order["del.type"],
      "Loading Date": order["Loading Date"],
      "Note": order["Note"] || "",
      "Forwarding agent name": order["Forwarding agent name"] || "N/A",
      "Name of ship-to party": order["Name of ship-to party"] || "N/A",
      "Total Weight": order["Total Weight"] || "N/A",
      "Bill of lading": order["Bill of lading"] || "N/A", // Přidáno "Bill of lading"
    }));

    setModalOrders(mappedOrders);
    setShowOrderListModal(true);
  }, [rawExcelData, t]); // parseExcelDate je externí, takže zde není potřeba

  // Funkce pro zobrazení historie statusů v modalu
  const handleShowStatusHistory = useCallback(async (deliveryIdentifier) => {
    if (!supabaseClient) {
      console.error("Supabase client not initialized for status history.");
      return;
    }
    setCurrentDeliveryNo(deliveryIdentifier);
    try {
      const { data, error } = await supabaseClient
        .from('delivery_status_log')
        .select('status, timestamp')
        .eq('delivery_no', deliveryIdentifier.trim()) // Trim for consistency
        .order('timestamp', { ascending: true });

      if (error) {
        console.error("Error fetching status history:", error.message);
        setDeliveryStatusLog([]);
      } else {
        setDeliveryStatusLog(data || []);
      }
    } catch (e) {
      console.error("Caught error fetching status history:", e);
      setDeliveryStatusLog([]);
    } finally {
      setShowStatusHistoryModal(true);
    }
  }, [supabaseClient]); // supabaseClient je závislost

  // Export zpožděných zakázek do CSV
  const exportDelayedOrdersCSV = async () => {
    if (!supabaseClient || typeof window.Blob === 'undefined') {
      console.error("Supabase client or Blob API not available for CSV export.");
      return;
    }

    try {
      const today = startOfDay(new Date());
      const { data, error } = await supabaseClient
        .from('deliveries')
        .select('"Delivery No", "Status", "del.type", "Loading Date", "Note", "Forwarding agent name", "Name of ship-to party", "Total Weight", "Bill of lading"') // Přidáno "Bill of lading"
        .lt('"Loading Date"', today.toISOString())
        .not('Status', 'in', '(50,60,70)'); // Zpožděné = Loading Date v minulosti A status není hotovo/odesláno

      if (error) {
        console.error('Error fetching delayed deliveries for CSV export:', error.message);
        return;
      }

      const headers = [
        t.deliveryNo,
        t.status,
        t.deliveryType,
        t.loadingDate,
        t.delay, // Add delay header for CSV
        t.note,
        t.forwardingAgent,
        t.shipToPartyName,
        t.totalWeight,
        t.billOfLading, // Přidáno "Bill of lading" do hlaviček
      ];

      const csvRows = [];
      csvRows.push(headers.join(',')); // Add headers to CSV

      data.forEach(item => {
        const parsedDate = parseISO(item["Loading Date"]); // Parse ISO string from DB
        const delayDays = isBefore(parsedDate, today) && ![50, 60, 70].includes(Number(item.Status)) ? differenceInDays(today, parsedDate) : 0;

        const row = [
          `"${item["Delivery No"]}"`,
          item.Status,
          `"${item["del.type"]}"`,
          `"${item["Loading Date"] ? format(parsedDate, 'dd.MM.yyyy') : ''}"`,
          delayDays,
          `"${(item.Note || '').replace(/"/g, '""')}"`, // Escape quotes in notes
          `"${(item["Forwarding agent name"] || '').replace(/"/g, '""')}"`,
          `"${(item["Name of ship-to party"] || '').replace(/"/g, '""')}"`,
          `"${(item["Total Weight"] || '')}"`,
          `"${(item["Bill of lading"] || '').replace(/"/g, '""')}"`, // Přidáno "Bill of lading" do řádku
        ].join(',');
        csvRows.push(row);
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${t.delayed}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href); // Clean up the URL object
    } catch (e) {
      console.error("Caught error during CSV export:", e);
    }
  };


  // Funkce pro porovnání dvou importů
  const handleCompareImports = async () => {
    if (!compareImport1Id || !compareImport2Id || !supabaseClient) {
      setComparisonResults(null);
      return;
    }

    try {
      // Načteme data pro první import z tabulky imports
      const { data: import1Raw, error: error1 } = await supabaseClient
        .from('imports')
        .select('data')
        .eq('id', compareImport1Id)
        .single();

      // Načteme data pro druhý import z tabulky imports
      const { data: import2Raw, error: error2 } = await supabaseClient
        .from('imports')
        .select('data')
        .eq('id', compareImport2Id)
        .single();

      if (error1 || error2) {
        console.error("Error fetching imports for comparison:", error1?.message || error2?.message);
        setComparisonResults({});
        return;
      }

      const import1Data = import1Raw.data;
      const import2Data = import2Raw.data;

      // Vytvoříme mapy pro snadné porovnání, s konzistentním klíčem (Delivery nebo Delivery No)
      const map1 = new Map(import1Data.map(d => [(d["Delivery"] || d["Delivery No"])?.trim(), Number(d.Status)]));
      const map2 = new Map(import2Data.map(d => [(d["Delivery"] || d["Delivery No"])?.trim(), Number(d.Status)]));

      const results = {};
      const allDeliveryNos = new Set([...map1.keys(), ...map2.keys()]); // Získáme všechna unikátní čísla dodávek z obou importů

      allDeliveryNos.forEach(deliveryIdentifier => {
          const status1 = map1.get(deliveryIdentifier);
          const status2 = map2.get(deliveryIdentifier);

          if (status1 === undefined && status2 !== undefined) {
              // Nová zakázka v importu 2
              const key = `new_order_${status2}`;
              results[key] = (results[key] || 0) + 1;
          } else if (status1 !== undefined && status2 === undefined) {
              // Zakázka odstraněna v importu 2 (nebo není přítomna)
              const key = `removed_order_${status1}`;
              results[key] = (results[key] || 0) + 1;
          } else if (status1 !== undefined && status2 !== undefined && status1 !== status2) {
              // Status se změnil
              const transitionKey = `${status1}_to_${status2}`;
              results[transitionKey] = (results[transitionKey] || 0) + 1;
          }
      });

      setComparisonResults(results);

    } catch (e) {
      console.error("Caught error during import comparison:", e);
      setComparisonResults({});
    }
  };


  // Komponenta pro modální okno (používá se pro detaily vyhledávání a seznam zakázek)
  const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          title={t.close}
        >
          <XCircle className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-blue-400 text-center">{title}</h2>
        {children}
      </div>
    </div>
  );

  // Nová komponenta pro zobrazení detailů jedné zakázky
  const OrderDetailsModal = ({ order, onClose, onShowStatusHistory, onSaveNote }) => {
    const [note, setNote] = useState(order.Note || '');

    useEffect(() => {
      setNote(order.Note || '');
    }, [order.Note]);

    const handleNoteBlur = () => {
      if (note !== order.Note) { // Only save if the note has actually changed
        onSaveNote(order["Delivery No"], note);
      }
    };

    return (
      <Modal title={t.deliveryDetails} onClose={onClose}>
        {order ? (
          <div className="space-y-3 text-gray-200">
            <p><strong>{t.deliveryNo}:</strong> {order["Delivery No"]}</p>
            <p><strong>{t.status}:</strong> {order.Status}</p>
            <p><strong>{t.deliveryType}:</strong> {order["del.type"]}</p>
            <p><strong>{t.loadingDate}:</strong> {order["Loading Date"] ? format(parseExcelDate(order["Loading Date"]), 'dd/MM/yyyy') : 'N/A'}</p>
            <p><strong>{t.forwardingAgent}:</strong> {order["Forwarding agent name"] || 'N/A'}</p>
            <p><strong>{t.shipToPartyName}:</strong> {order["Name of ship-to party"] || 'N/A'}</p>
            <p><strong>{t.totalWeight}:</strong> {order["Total Weight"] || 'N/A'}</p>
            <p><strong>{t.billOfLading}:</strong> {order["Bill of lading"] || 'N/A'}</p> {/* Zobrazení "Bill of lading" */}
            <div>
              <strong>{t.note}:</strong>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={handleNoteBlur} // Save on blur
                className="w-full p-1 rounded-md bg-gray-600 border border-gray-500 text-gray-100 text-sm focus:ring-blue-500 focus:border-blue-500 mt-1"
                placeholder={t.note}
              />
            </div>
            {order.processingTime && <p><strong>{t.processingTime}:</strong> {order.processingTime}</p>}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => onShowStatusHistory(order["Delivery No"])}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <History className="w-5 h-5" /> {t.statusHistory}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400">{t.deliveryNotFound}</p>
        )}
      </Modal>
    );
  };


  // Komponenta pro zobrazení seznamu zakázek v modalu (používá se pro CardClick)
  const OrderListTable = ({ orders, onSelectOrder }) => (
    <div className="overflow-x-auto mt-4">
      {orders.length > 0 ? (
        <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
          <thead className="bg-gray-600">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.deliveryNo}</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.status}</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.deliveryType}</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.loadingDate}</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.forwardingAgent}</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.shipToPartyName}</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.totalWeight}</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.billOfLading}</th> {/* Nový sloupec */}
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.note}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr 
                key={order["Delivery No"] || index} 
                className={`border-t border-gray-600 cursor-pointer ${index % 2 === 0 ? "bg-gray-750" : "bg-gray-700"} hover:bg-gray-600 transition-colors`}
                onClick={() => onSelectOrder(order)} // Click opens OrderDetailsModal
              >
                <td className="py-3 px-4 text-gray-200">{order["Delivery No"]}</td>
                <td className="py-3 px-4 text-gray-200">{order.Status}</td>
                <td className="py-3 px-4 text-gray-200">{order["del.type"]}</td>
                <td className="py-3 px-4 text-gray-200">{order["Loading Date"] ? format(parseExcelDate(order["Loading Date"]), 'dd/MM/yyyy') : 'N/A'}</td>
                <td className="py-3 px-4 text-gray-200">{order["Forwarding agent name"] || 'N/A'}</td>
                <td className="py-3 px-4 text-gray-200">{order["Name of ship-to party"] || 'N/A'}</td>
                <td className="py-3 px-4 text-gray-200">{order["Total Weight"] || 'N/A'}</td>
                <td className="py-3 px-4 text-gray-200">{order["Bill of lading"] || 'N/A'}</td> {/* Zobrazení "Bill of lading" */}
                <td className="py-3 px-4 text-gray-200">{order.Note || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-400">{t.noDataAvailable}</p>
      )}
    </div>
  );


  // Autentikační formulář
  if (!isAuthenticated) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"} transition-colors duration-300`}>
        <Card className="p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">{t.loginTitle}</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                {t.username}
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                {t.password}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-2 rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" /> {t.loginButton}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Hlavní dashboard UI
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

      {/* Historie importů - přesunuta sem */}
      {importHistory.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg max-w-lg mx-auto">
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

      {/* Modální okno pro detaily jedné zakázky (nové) */}
      {selectedOrderDetails && (
        <OrderDetailsModal
          order={selectedOrderDetails}
          onClose={() => setSelectedOrderDetails(null)}
          onShowStatusHistory={handleShowStatusHistory}
          onSaveNote={handleSaveNote} // Pass the save function
        />
      )}

      {/* Modální okno pro potvrzení smazání */}
      {showDeleteConfirm && (
        <Modal title={t.deleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
          <p className="text-lg mb-4 text-center">{t.deleteConfirm}</p>
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
        </Modal>
      )}

      {/* Modální okno pro seznam zakázek (po kliknutí na karty) */}
      {showOrderListModal && (
        <Modal title={modalTitle} onClose={() => setShowOrderListModal(false)}>
          <OrderListTable orders={modalOrders} onSelectOrder={setSelectedOrderDetails} />
        </Modal>
      )}

      {/* Modální okno pro historii statusů */}
      {showStatusHistoryModal && (
        <Modal title={`${t.statusHistory} - ${currentDeliveryNo}`} onClose={() => setShowStatusHistoryModal(false)}>
          {deliveryStatusLog.length > 0 ? (
            <ul className="text-gray-200 text-sm space-y-1">
              {deliveryStatusLog.map((log, idx) => (
                <li key={idx}>
                  Status {log.status} - {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400">{t.noDataAvailable}</p>
          )}
        </Modal>
      )}


      {!summary && (
        <p className="text-gray-400 text-center mt-8">{t.uploadFilePrompt}</p>
      )}

      {summary && (
        <div id="report-section" className="space-y-10">
          {/* Navigace záložek */}
          <div className="flex space-x-1 rounded-xl bg-gray-800 p-1 mb-8 max-w-2xl mx-auto">
            <button
              onClick={() => setActiveTab(0)}
              className={`w-full py-2.5 text-sm leading-5 font-medium rounded-lg focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-700 ring-white ring-opacity-60 ${activeTab === 0 ? 'bg-blue-600 text-white shadow' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`}
            >
              {t.dashboardTab}
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`w-full py-2.5 text-sm leading-5 font-medium rounded-lg focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-700 ring-white ring-opacity-60 ${activeTab === 1 ? 'bg-blue-600 text-white shadow' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`}
            >
              {t.delayedOrdersTab}
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={`w-full py-2.5 text-sm leading-5 font-medium rounded-lg focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-700 ring-white ring-opacity-60 ${activeTab === 2 ? 'bg-blue-600 text-white shadow' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`}
            >
              {t.importComparisonTab}
            </button>
            <button
              onClick={() => setActiveTab(3)} // New tab for Order Search
              className={`w-full py-2.5 text-sm leading-5 font-medium rounded-lg focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-700 ring-white ring-opacity-60 ${activeTab === 3 ? 'bg-blue-600 text-white shadow' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`}
            >
              {t.orderSearchTab}
            </button>
          </div>

          {/* Obsah záložek */}
          {activeTab === 0 && ( // Dashboard Tab Content
            <>
              {/* Sekce datových filtrů - kompaktní a sbalitelná */}
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
                        <option value="all">All</option>
                        <option value="yesterday">{format(subDays(startOfDay(new Date()), 1), 'dd/MM/yyyy')}</option>
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

              {/* Status Distribution Chart (Moved to top) */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-400" />{" "}
                  {t.statusDistribution}
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => setChartTypeOrdersOverTime('bar')}
                      className={`p-2 rounded-full ${chartTypeOrdersOverTime === 'bar' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-blue-700 transition-colors`}
                      title={t.barChart}
                    >
                      <BarChart3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setChartTypeOrdersOverTime('pie')}
                      className={`p-2 rounded-full ${chartTypeOrdersOverTime === 'pie' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-blue-700 transition-colors`}
                      title={t.pieChart}
                    >
                      <PieChartIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setChartTypeOrdersOverTime('stackedBar')}
                      className={`p-2 rounded-full ${chartTypeOrdersOverTime === 'stackedBar' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-blue-700 transition-colors`}
                      title={t.stackedBarChart}
                    >
                      <BarChart3 className="w-5 h-5 rotate-90" /> {/* Rotated icon for stacked */}
                    </button>
                  </div>
                </h2>
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-md">
                  {statusPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      {chartTypeOrdersOverTime === 'bar' ? (
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
                      ) : chartTypeOrdersOverTime === 'pie' ? (
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
                      ) : ( // Stacked Bar Chart by Loading Date
                        <BarChart
                          data={statusStackedChartData}
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
                          {/* Dynamicky přidáme Bar komponenty pro každý status */}
                          {uniqueStatuses.map(status => (
                            <Bar key={`status-bar-${status}`} dataKey={`status${status}`} name={`Status ${status}`} fill={CHART_COLORS[status % CHART_COLORS.length]} stackId="statusStack" />
                          ))}
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-80 bg-gray-700 text-gray-400 rounded-xl">
                      <p className="text-lg">{t.noDataAvailable}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {Object.entries(summary.byDay).map(
                  ([date, stats]) => (
                    <Card key={date}>
                      <CardContent>
                        <h2 className="text-lg font-semibold text-blue-400 mb-2">
                          {format(new Date(date), 'dd/MM/yyyy')}
                        </h2>
                        <p className="text-gray-200 cursor-pointer hover:text-blue-300" onClick={() => handleCardClick('total', [], null, date)}>
                          {t.total}: <strong>{stats.total}</strong>
                        </p>
                        <p className="text-green-400 cursor-pointer hover:text-green-300" onClick={() => handleCardClick('done', [50, 60, 70], null, date)}>
                          {t.done}: <strong>{stats.done}</strong>
                        </p>
                        <p className="text-red-400 cursor-pointer hover:text-red-300" onClick={() => handleCardClick('remaining', [10, 31, 35, 40], null, date)}>
                          {t.remaining}:{" "}
                          <strong>
                            {stats.remaining}
                          </strong>
                        </p>
                        <p className="text-yellow-400 cursor-pointer hover:text-yellow-300" onClick={() => handleCardClick('inProgress', [31, 35, 40], null, date)}>
                          {t.inProgress}: <strong>{stats.inProgress}</strong>
                        </p>
                        <p className="text-blue-400 cursor-pointer hover:text-blue-300" onClick={() => handleCardClick('newOrders', [10], null, date)}>
                          {t.newOrders}: <strong>{stats.newOrders}</strong>
                        </p>
                        <p className="text-gray-200 cursor-pointer hover:text-gray-300" onClick={() => handleCardClick('pallets', [], 'P', date)}>
                          {t.pallets}: <strong>{stats.pallets}</strong>
                        </p>
                        <p className="text-gray-200 cursor-pointer hover:text-gray-300" onClick={() => handleCardClick('carton', [], 'K', date)}>
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
                          <p key={status} className="text-gray-200 cursor-pointer hover:text-gray-300" onClick={() => handleCardClick('status', [Number(status)])}>
                            Status {status}:{" "}
                            <strong>{count}</strong>
                          </p>
                        ))
                    ) : (
                      <p className="text-gray-400">{t.noDataAvailable}</p>
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
                          <p key={type} className="text-gray-200 cursor-pointer hover:text-gray-300" onClick={() => handleCardClick('deliveryType', [], type)}>
                            {type === "P" ? t.pallets : t.carton}:{" "}
                            <strong>{count}</strong>
                          </p>
                        )
                      )
                    ) : (
                      <p className="text-gray-400">{t.noDataAvailable}</p>
                    )}
                    <p className="text-gray-200 pt-2">
                      {t.sentPallets}:{" "}
                      <strong>{summary.sentPallets}</strong>
                    </p>
                    <p className="text-gray-200">
                      {t.sentCartons}:{" "}
                      <strong>{summary.sentCartons}</strong>
                    </p>
                    <p className="text-red-400 pt-2 font-bold cursor-pointer hover:text-red-300" onClick={() => handleCardClick('delayed', [])}>
                      {t.delayed}:{" "}
                      <strong>{summary.delayed}</strong>
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Grafy */}
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
                    {ordersOverTimeData.length > 0 ? (
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
                    ) : (
                      <div className="flex items-center justify-center h-80 bg-gray-700 text-gray-400 rounded-xl">
                        <p className="text-lg">{t.noDataAvailable}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* New Chart: In Progress Only (statuses 31, 35, 40) */}
                <div>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-orange-400" />{" "}
                    {t.inProgressOnly}
                  </h2>
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-md">
                    {inProgressOnlyChartData.length > 0 ? (
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
                    ) : (
                      <div className="flex items-center justify-center h-80 bg-gray-700 text-gray-400 rounded-xl">
                        <p className="text-lg">{t.noDataAvailable}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* New Chart: Shipments (statuses 50, 60, 70) */}
                <div>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-green-400" />{" "}
                    {t.shipments}
                  </h2>
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-md">
                    {shipmentsChartData.length > 0 ? (
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
                    ) : (
                      <div className="flex items-center justify-center h-80 bg-gray-700 text-gray-400 rounded-xl">
                        <p className="text-lg">{t.noDataAvailable}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* New Chart: Shift Comparison (Hotovo) */}
                <div>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-purple-400" />{" "}
                    {t.shiftComparison}
                  </h2>
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-md">
                    {shiftComparisonData.length > 0 && shiftComparisonData.some(d => d.value > 0) ? (
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
                    ) : (
                      <div className="flex items-center justify-center h-80 bg-gray-700 text-gray-400 rounded-xl">
                        <p className="text-lg">{t.noDataAvailable}</p>
                      </div>
                    )}
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
                    {deliveryTypePieData.length > 0 ? (
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
                    ) : (
                      <div className="flex items-center justify-center h-80 bg-gray-700 text-gray-400 rounded-xl">
                        <p className="text-lg">{t.noDataAvailable}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 1 && ( // Delayed Orders Tab Content
            <Card>
              <CardContent>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-red-400">
                  <ClipboardList className="w-6 h-6" /> {t.delayed}
                  <button
                    onClick={exportDelayedOrdersCSV} // Changed to CSV export
                    className="ml-auto flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 transition-colors text-base"
                  >
                    <FileDown className="w-5 h-5" /> {t.exportToCSV}
                  </button>
                </h2>
                <p className="text-gray-200 text-lg mb-4">
                  {t.totalDelayed}: <strong className="text-red-400">{summary.delayedOrdersList.length}</strong>
                </p>
                <div className="overflow-x-auto">
                  {summary.delayedOrdersList.length > 0 ? (
                    <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.deliveryNo}</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.status}</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.deliveryType}</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.loadingDate}</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.delay}</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.billOfLading}</th> {/* Nový sloupec */}
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-100">{t.note}</th>
                          {/* Akce column removed as row click handles details */}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Zobrazit pouze 10 řádků nebo všechny, pokud jsou rozbalené */}
                        {(showAllDelayed ? summary.delayedOrdersList : summary.delayedOrdersList.slice(0, 10)).map((order, index) => (
                          <tr 
                            key={order.delivery || index} 
                            className={`border-t border-gray-600 cursor-pointer ${index % 2 === 0 ? "bg-gray-750" : "bg-gray-700"} hover:bg-gray-600 transition-colors`}
                            onClick={() => setSelectedOrderDetails({ // Open OrderDetailsModal on row click
                                "Delivery No": order.delivery,
                                "Status": order.status,
                                "del.type": order.delType,
                                "Loading Date": order.loadingDate,
                                "Note": order.note,
                                "Forwarding agent name": order["Forwarding agent name"],
                                "Name of ship-to party": order["Name of ship-to party"],
                                "Total Weight": order["Total Weight"],
                                "Bill of lading": order["Bill of lading"], // Přidáno "Bill of lading"
                                // No processingTime for delayed list directly
                            })}
                          >
                            <td className="py-3 px-4 text-gray-200">{order.delivery}</td>
                            <td className="py-3 px-4 text-gray-200">{order.status}</td>
                            <td className="py-3 px-4 text-gray-200">{order.delType}</td>
                            <td className="py-3 px-4 text-gray-200">{order.loadingDate}</td>
                            <td className={`py-3 px-4 font-semibold ${getDelayColorClass(order.delayDays)}`}>{order.delayDays}</td>
                            <td className="py-3 px-4 text-gray-200">{order["Bill of lading"] || 'N/A'}</td> {/* Zobrazení "Bill of lading" */}
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={order.note}
                                onChange={(e) => {
                                  // Update local state immediately for responsiveness
                                  const updatedDelayedList = [...summary.delayedOrdersList];
                                  updatedDelayedList[index].note = e.target.value;
                                  setSummary({ ...summary, delayedOrdersList: updatedDelayedList });
                                }}
                                onBlur={(e) => handleSaveNote(order.delivery, e.target.value)} // Save on blur
                                className="w-full p-1 rounded-md bg-gray-600 border border-gray-500 text-gray-100 text-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder={t.note}
                                onClick={(e) => e.stopPropagation()} // Prevent row click when editing note
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-gray-400">{t.noDataAvailable}</p>
                  )}
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

          {activeTab === 2 && ( // Import Comparison Tab Content
            <Card>
              <CardContent>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-yellow-400">
                  <History className="w-6 h-6" /> {t.importComparisonTab}
                </h2>
                <p className="text-gray-200 mb-4">{t.selectImportsToCompare}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="compare-import-1" className="block text-sm font-medium text-gray-400 mb-1">{t.import1}:</label>
                    <select
                      id="compare-import-1"
                      value={compareImport1Id}
                      onChange={(e) => setCompareImport1Id(e.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t.selectImport}</option>
                      {importHistory.map((imp) => (
                        <option key={imp.id} value={imp.id}>
                          {imp.date_label} - {imp.original_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="compare-import-2" className="block text-sm font-medium text-gray-400 mb-1">{t.import2}:</label>
                    <select
                      id="compare-import-2"
                      value={compareImport2Id}
                      onChange={(e) => setCompareImport2Id(e.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t.selectImport}</option>
                      {importHistory.map((imp) => (
                        <option key={imp.id} value={imp.id}>
                          {imp.date_label} - {imp.original_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleCompareImports}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  disabled={!compareImport1Id || !compareImport2Id || compareImport1Id === compareImport2Id}
                >
                  <Search className="w-5 h-5" /> {t.compare}
                </button>

                {comparisonResults && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4 text-white">{t.comparisonResults}</h3>
                    {Object.values(comparisonResults).every(val => val === 0) ? (
                      <p className="text-gray-400">{t.noChangesDetected}</p>
                    ) : (
                      <ul className="space-y-2">
                        {Object.entries(comparisonResults).map(([key, count]) => {
                          if (count > 0) {
                            let displayKey = key;
                            if (key.startsWith('new_order_')) {
                                displayKey = `${t.new_order} ${key.split('_')[2]})`;
                            } else if (key.startsWith('removed_order_')) {
                                displayKey = `${t.removed_order} ${key.split('_')[2]})`;
                            } else if (STATUS_TRANSITIONS[key]) {
                                displayKey = t[STATUS_TRANSITIONS[key]];
                            } else {
                                displayKey = key.replace(/_/g, ' '); // Fallback for unexpected transitions
                            }
                            return (
                              <li key={key} className="text-gray-200">
                                <span className="font-semibold text-blue-300">{displayKey}:</span> {count} {t.orders}
                              </li>
                            );
                          }
                          return null;
                        })}
                      </ul>
                    )}
                  </div>
                )}
                {!comparisonResults && (compareImport1Id && compareImport2Id && compareImport1Id !== compareImport2Id) && (
                  <p className="text-gray-400 text-center mt-8">{t.noComparisonSelected}</p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 3 && ( // New Order Search Tab Content
            <Card>
              <CardContent>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-blue-400">
                  <Search className="w-6 h-6" /> {t.orderSearchTab}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="search-delivery-no" className="block text-sm font-medium text-gray-400 mb-1">{t.deliveryNo}:</label>
                    <input
                      type="text"
                      id="search-delivery-no"
                      value={searchDeliveryNo}
                      onChange={(e) => setSearchDeliveryNo(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearchOrders(); }}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t.enterDeliveryNo}
                    />
                  </div>
                  <div>
                    <label htmlFor="search-loading-date" className="block text-sm font-medium text-gray-400 mb-1">{t.loadingDate}:</label>
                    <input
                      type="date"
                      id="search-loading-date"
                      value={searchLoadingDate}
                      onChange={(e) => setSearchLoadingDate(e.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="search-status" className="block text-sm font-medium text-gray-400 mb-1">{t.status}:</label>
                    <select
                      id="search-status"
                      value={searchStatus}
                      onChange={(e) => setSearchStatus(e.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All</option>
                      {uniqueStatuses.map(status => (
                        <option key={`search-status-${status}`} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="search-ship-to-party" className="block text-sm font-medium text-gray-400 mb-1">{t.filterByNameOfShipToParty}:</label>
                    <select
                      id="search-ship-to-party"
                      value={searchShipToPartyName}
                      onChange={(e) => setSearchShipToPartyName(e.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="MAN">{t.man}</option>
                      <option value="Daimler">{t.daimler}</option>
                      <option value="Volvo">{t.volvo}</option>
                      <option value="Iveco">{t.iveco}</option>
                      <option value="Scania">{t.scania}</option>
                      <option value="DAF">{t.daf}</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleSearchOrders}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" /> {t.searchOrders}
                </button>

                {searchOrdersResult.length > 0 ? (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4 text-white">{t.orderList}</h3>
                    <OrderListTable orders={searchOrdersResult} onSelectOrder={setSelectedOrderDetails} />
                  </div>
                ) : (
                  searchDeliveryNo || searchLoadingDate || searchStatus !== 'all' || searchShipToPartyName !== 'all' ? (
                    <p className="text-red-400 text-center mt-8">{t.noOrdersFound}</p>
                  ) : null
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
