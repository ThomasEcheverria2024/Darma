import { supabase } from "@/lib/supabase";
import type { AppState, Customer, Product, Sale } from "@/types";

const STORAGE_KEY = "darma-state-v1";

const catalogProducts = [
  { id: 1, name: "CHERRY QUICK", sku: "DAR-001", category: "CERAS LÍQUIDAS", stock: 9, cost: 3850.0000000000005, salePrice: 6400.0, minStock: 4 },
  { id: 2, name: "EXTREME DETAIL", sku: "DAR-002", category: "CERAS LÍQUIDAS", stock: 10, cost: 4015.0000000000005, salePrice: 6700.0, minStock: 5 },
  { id: 3, name: "WATERLESS", sku: "DAR-003", category: "CERAS LÍQUIDAS", stock: 11, cost: 4015.0000000000005, salePrice: 6700.0, minStock: 6 },
  { id: 4, name: "ILUSSION WAX", sku: "DAR-004", category: "CERAS LÍQUIDAS", stock: 12, cost: 5060.0, salePrice: 8500.0, minStock: 3 },
  { id: 5, name: "LUXURY", sku: "DAR-005", category: "CERAS LÍQUIDAS", stock: 13, cost: 6050.000000000001, salePrice: 10000.0, minStock: 4 },
  { id: 6, name: "LA LAVISH", sku: "DAR-006", category: "CERAS LÍQUIDAS", stock: 14, cost: 8250.0, salePrice: 13600.0, minStock: 5 },
  { id: 7, name: "THE BO$$ SHINE", sku: "DAR-007", category: "CERAS LÍQUIDAS", stock: 15, cost: 5060.0, salePrice: 8500.0, minStock: 6 },
  { id: 8, name: "ENERGY SEAL", sku: "DAR-008", category: "CERAS LÍQUIDAS", stock: 16, cost: 4950.0, salePrice: 8200.0, minStock: 3 },
  { id: 9, name: "SEAL IT ALL", sku: "DAR-009", category: "CERAS LÍQUIDAS", stock: 17, cost: 6710.000000000001, salePrice: 11000.0, minStock: 4 },
  { id: 10, name: "ATOMIC", sku: "DAR-010", category: "LAVA AUTOS", stock: 18, cost: 3190.0000000000005, salePrice: 5300.0, minStock: 5 },
  { id: 11, name: "BANANA", sku: "DAR-011", category: "LAVA AUTOS", stock: 19, cost: 3190.0000000000005, salePrice: 5300.0, minStock: 6 },
  { id: 12, name: "WAX", sku: "DAR-012", category: "LAVA AUTOS", stock: 20, cost: 3685.0000000000005, salePrice: 6100.0, minStock: 3 },
  { id: 13, name: "SUPREME", sku: "DAR-013", category: "LAVA AUTOS", stock: 21, cost: 3960.0000000000005, salePrice: 6500.0, minStock: 4 },
  { id: 14, name: "PURE FOAM", sku: "DAR-014", category: "LAVA AUTOS", stock: 8, cost: 4180.0, salePrice: 6900.0, minStock: 5 },
  { id: 15, name: "LUXURY FOAM", sku: "DAR-015", category: "LAVA AUTOS", stock: 9, cost: 6160.000000000001, salePrice: 10200.0, minStock: 6 },
  { id: 16, name: "ELITE", sku: "DAR-016", category: "LAVA AUTOS", stock: 10, cost: 4235.0, salePrice: 7000.0, minStock: 3 },
  { id: 17, name: "DIP CLUB", sku: "DAR-017", category: "LAVA AUTOS", stock: 11, cost: 4290.0, salePrice: 7100.0, minStock: 4 },
  { id: 18, name: "ENERGY", sku: "DAR-018", category: "LAVA AUTOS", stock: 12, cost: 4070.0000000000005, salePrice: 6700.0, minStock: 5 },
  { id: 19, name: "HYPER BLACK", sku: "DAR-019", category: "LAVA AUTOS", stock: 13, cost: 4455.0, salePrice: 7500.0, minStock: 6 },
  { id: 20, name: "INFERNO GEL", sku: "DAR-020", category: "LIMPIADORES", stock: 14, cost: 4785.0, salePrice: 7900.0, minStock: 3 },
  { id: 21, name: "ALL CLEAN", sku: "DAR-021", category: "LIMPIADORES", stock: 15, cost: 3905.0000000000005, salePrice: 6500.0, minStock: 4 },
  { id: 22, name: "ALCALINE WHELLS", sku: "DAR-022", category: "LIMPIADORES", stock: 16, cost: 4345.0, salePrice: 7200.0, minStock: 5 },
  { id: 23, name: "FORMULE CONQUEST", sku: "DAR-023", category: "LIMPIADORES", stock: 17, cost: 4070.0000000000005, salePrice: 6700.0, minStock: 6 },
  { id: 24, name: "WATER SPOT", sku: "DAR-024", category: "LIMPIADORES", stock: 18, cost: 6710.000000000001, salePrice: 11000.0, minStock: 3 },
  { id: 25, name: "ALU WASH", sku: "DAR-025", category: "LIMPIADORES", stock: 19, cost: 4400.0, salePrice: 7300.0, minStock: 4 },
  { id: 26, name: "CTRL Z", sku: "DAR-026", category: "LIMPIADORES", stock: 20, cost: 5500.0, salePrice: 9100.0, minStock: 5 },
  { id: 27, name: "BUG REMOVER", sku: "DAR-027", category: "LIMPIADORES", stock: 21, cost: 3630.0000000000005, salePrice: 6000.0, minStock: 6 },
  { id: 28, name: "CLEAN VISION", sku: "DAR-028", category: "LIMPIADORES", stock: 8, cost: 3410.0000000000005, salePrice: 5600.0, minStock: 3 },
  { id: 29, name: "X-TAR", sku: "DAR-029", category: "LIMPIADORES", stock: 9, cost: 9515.0, salePrice: 15699.75, minStock: 4 },
  { id: 30, name: "IRON WARNING", sku: "DAR-030", category: "LIMPIADORES", stock: 10, cost: 10450.0, salePrice: 17300.0, minStock: 5 },
  { id: 31, name: "NTP", sku: "DAR-031", category: "REVITALIZADORES DE EXTERIORES", stock: 11, cost: 6588.0, salePrice: 10700.0, minStock: 6 },
  { id: 32, name: "HELLS", sku: "DAR-032", category: "REVITALIZADORES DE EXTERIORES", stock: 12, cost: 8856.0, salePrice: 14500.0, minStock: 3 },
  { id: 33, name: "NEW TIRE", sku: "DAR-033", category: "REVITALIZADORES DE EXTERIORES", stock: 13, cost: 7344.000000000001, salePrice: 11900.0, minStock: 4 },
  { id: 34, name: "BLUE MAGIC", sku: "DAR-034", category: "REVITALIZADORES DE EXTERIORES", stock: 14, cost: 10638.0, salePrice: 17300.0, minStock: 5 },
  { id: 35, name: "GEL SHINE", sku: "DAR-035", category: "REVITALIZADORES DE EXTERIORES", stock: 15, cost: 16740.0, salePrice: 27000.0, minStock: 6 },
  { id: 36, name: "DARK FLUID", sku: "DAR-036", category: "REVITALIZADORES DE EXTERIORES", stock: 16, cost: 4158.0, salePrice: 6700.0, minStock: 3 },
  { id: 37, name: "HITS BONES", sku: "DAR-037", category: "REVITALIZADORES DE EXTERIORES", stock: 17, cost: 3726.0000000000005, salePrice: 6000.0, minStock: 4 },
  { id: 38, name: "BUBBLE GUM", sku: "DAR-038", category: "REVIVIDORES DE INTERIORES", stock: 18, cost: 6270.000000000001, salePrice: 10500.0, minStock: 5 },
  { id: 39, name: "TRIM LOOK CANDY", sku: "DAR-039", category: "REVIVIDORES DE INTERIORES", stock: 19, cost: 6270.000000000001, salePrice: 10500.0, minStock: 6 },
  { id: 40, name: "MANGO GO", sku: "DAR-040", category: "REVIVIDORES DE INTERIORES", stock: 20, cost: 6270.000000000001, salePrice: 10500.0, minStock: 3 },
  { id: 41, name: "SPRAY LEATHER", sku: "DAR-041", category: "REVIVIDORES DE INTERIORES", stock: 21, cost: 13200.000000000002, salePrice: 21800.0, minStock: 4 },
  { id: 42, name: "HOLY GLOSS", sku: "DAR-042", category: "REVIVIDORES DE INTERIORES", stock: 8, cost: 6600.000000000001, salePrice: 10900.0, minStock: 5 },
  { id: 43, name: "CANDY CREAM", sku: "DAR-043", category: "REVIVIDORES DE INTERIORES", stock: 9, cost: 6600.000000000001, salePrice: 10900.0, minStock: 6 },
  { id: 44, name: "UVA SHAKE", sku: "DAR-044", category: "REVIVIDORES DE INTERIORES", stock: 10, cost: 6600.000000000001, salePrice: 10900.0, minStock: 3 },
  { id: 45, name: "MASH MELON", sku: "DAR-045", category: "REVIVIDORES DE INTERIORES", stock: 11, cost: 6600.000000000001, salePrice: 10900.0, minStock: 4 },
  { id: 46, name: "FRUTY CREAM", sku: "DAR-046", category: "REVIVIDORES DE INTERIORES", stock: 12, cost: 6600.000000000001, salePrice: 10900.0, minStock: 5 },
  { id: 47, name: "CREME LOOK", sku: "DAR-047", category: "REVIVIDORES DE INTERIORES", stock: 13, cost: 6600.000000000001, salePrice: 10900.0, minStock: 6 },
  { id: 48, name: "ENERGY TRIM", sku: "DAR-048", category: "REVIVIDORES DE INTERIORES", stock: 14, cost: 6600.000000000001, salePrice: 10900.0, minStock: 3 },
  { id: 49, name: "SNEAKERS", sku: "DAR-049", category: "REVIVIDORES DE INTERIORES", stock: 15, cost: 6600.000000000001, salePrice: 10900.0, minStock: 4 },
  { id: 50, name: "TRIM LEATHER", sku: "DAR-050", category: "REVIVIDORES DE INTERIORES", stock: 16, cost: 6820.000000000001, salePrice: 11300.0, minStock: 5 },
  { id: 51, name: "LUXURY TRIM", sku: "DAR-051", category: "REVIVIDORES DE INTERIORES", stock: 17, cost: 8250.0, salePrice: 13600.0, minStock: 6 },
  { id: 52, name: "FASCIA SIO2", sku: "DAR-052", category: "REVIVIDORES DE INTERIORES", stock: 18, cost: 8800.0, salePrice: 14500.0, minStock: 3 },
  { id: 53, name: "CLAY LUB", sku: "DAR-053", category: "LINEA PROFESIONAL", stock: 19, cost: 3025.0000000000005, salePrice: 5000.0, minStock: 4 },
  { id: 54, name: "PAINT PREPARE", sku: "DAR-054", category: "LINEA PROFESIONAL", stock: 20, cost: 4070.0000000000005, salePrice: 6700.0, minStock: 5 },
  { id: 55, name: "POLISH", sku: "DAR-055", category: "LINEA PROFESIONAL", stock: 21, cost: 14300.000000000002, salePrice: 23600.0, minStock: 6 },
  { id: 56, name: "FINISH", sku: "DAR-056", category: "LINEA PROFESIONAL", stock: 8, cost: 10450.0, salePrice: 17200.0, minStock: 3 },
  { id: 57, name: "LIGHT COLORS", sku: "DAR-057", category: "LINEA PROFESIONAL", stock: 9, cost: 8910.0, salePrice: 14700.0, minStock: 4 },
  { id: 58, name: "DARK COLORS", sku: "DAR-058", category: "LINEA PROFESIONAL", stock: 10, cost: 8910.0, salePrice: 14700.0, minStock: 5 },
  { id: 59, name: "ALL IN ONE", sku: "DAR-059", category: "LINEA PROFESIONAL", stock: 11, cost: 10450.0, salePrice: 17200.0, minStock: 6 },
  { id: 60, name: "CREME WAX BANANA", sku: "DAR-060", category: "LINEA PROFESIONAL", stock: 12, cost: 4510.0, salePrice: 7500.0, minStock: 3 },
  { id: 61, name: "MYSTIC SEAL", sku: "DAR-061", category: "LINEA PROFESIONAL", stock: 13, cost: 4510.0, salePrice: 7500.0, minStock: 4 },
  { id: 62, name: "WATERMELON", sku: "DAR-062", category: "LINEA PROFESIONAL", stock: 14, cost: 9075.0, salePrice: 15000.0, minStock: 5 },
  { id: 63, name: "DOSIFICADOR", sku: "DAR-063", category: "ENVASE", stock: 15, cost: 2420.0, salePrice: 4000.0, minStock: 6 },
  { id: 64, name: "CLEAN STUFF", sku: "DAR-064", category: "AEROSOLES", stock: 16, cost: 5610.0, salePrice: 9300.0, minStock: 3 },
  { id: 65, name: "BACK TO BLACK", sku: "DAR-065", category: "AEROSOLES", stock: 17, cost: 7865.000000000001, salePrice: 13000.0, minStock: 4 },
  { id: 66, name: "NTP", sku: "DAR-066", category: "250", stock: 18, cost: 3850.0000000000005, salePrice: 6400.0, minStock: 5 },
  { id: 67, name: "HELLS", sku: "DAR-067", category: "250", stock: 19, cost: 4620.0, salePrice: 7600.0, minStock: 6 },
  { id: 68, name: "NEW TIRE", sku: "DAR-068", category: "250", stock: 20, cost: 4015.0000000000005, salePrice: 6600.0, minStock: 3 },
  { id: 69, name: "GEL SHINE", sku: "DAR-069", category: "250", stock: 21, cost: 8580.0, salePrice: 14200.0, minStock: 4 },
  { id: 70, name: "CREME LOOK", sku: "DAR-070", category: "250", stock: 8, cost: 3520.0000000000005, salePrice: 5800.0, minStock: 5 },
  { id: 71, name: "LUXURY TRIM", sku: "DAR-071", category: "250", stock: 9, cost: 4400.0, salePrice: 7300.0, minStock: 6 },
  { id: 72, name: "FASCIA SIO2", sku: "DAR-072", category: "250", stock: 10, cost: 4950.0, salePrice: 8200.0, minStock: 3 },
  { id: 73, name: "MINI ALL IN ONE", sku: "DAR-073", category: "MINIS", stock: 11, cost: 3630.0000000000005, salePrice: 6000.0, minStock: 4 },
  { id: 74, name: "MINI POLISH", sku: "DAR-074", category: "MINIS", stock: 12, cost: 3630.0000000000005, salePrice: 6000.0, minStock: 5 },
  { id: 75, name: "MINI FINISH", sku: "DAR-075", category: "MINIS", stock: 13, cost: 3630.0000000000005, salePrice: 6000.0, minStock: 6 },
  { id: 76, name: "MINI LIGHT COLORS", sku: "DAR-076", category: "MINIS", stock: 14, cost: 3630.0000000000005, salePrice: 6000.0, minStock: 3 },
  { id: 77, name: "MINI DARK COLORS", sku: "DAR-077", category: "MINIS", stock: 15, cost: 3630.0000000000005, salePrice: 6000.0, minStock: 4 },
  { id: 78, name: "MINI MYSTIC", sku: "DAR-078", category: "MINIS", stock: 16, cost: 3630.0000000000005, salePrice: 6000.0, minStock: 5 },
  { id: 79, name: "MINI WAX BANANA", sku: "DAR-079", category: "MINIS", stock: 17, cost: 3630.0000000000005, salePrice: 6000.0, minStock: 6 },
  { id: 80, name: "MINI WATERMELON", sku: "DAR-080", category: "MINIS", stock: 18, cost: 3630.0000000000005, salePrice: 6000.0, minStock: 3 },
  { id: 81, name: "PARTY SUMMER", sku: "DAR-081", category: "PERFUMES", stock: 19, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 4 },
  { id: 82, name: "NEW CAR", sku: "DAR-082", category: "PERFUMES", stock: 20, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 5 },
  { id: 83, name: "CANDY BANANA", sku: "DAR-083", category: "PERFUMES", stock: 21, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 6 },
  { id: 84, name: "SWEET FRUTTI", sku: "DAR-084", category: "PERFUMES", stock: 8, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 3 },
  { id: 85, name: "CHERRY", sku: "DAR-085", category: "PERFUMES", stock: 9, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 4 },
  { id: 86, name: "MANGO GO", sku: "DAR-086", category: "PERFUMES", stock: 10, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 5 },
  { id: 87, name: "BUBBLE GUM", sku: "DAR-087", category: "PERFUMES", stock: 11, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 6 },
  { id: 88, name: "UVA", sku: "DAR-088", category: "PERFUMES", stock: 12, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 3 },
  { id: 89, name: "THE BOSS", sku: "DAR-089", category: "PERFUMES", stock: 13, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 4 },
  { id: 90, name: "FRESH LEMON & MINT", sku: "DAR-090", category: "PERFUMES", stock: 14, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 5 },
  { id: 91, name: "ROCKET POWER", sku: "DAR-091", category: "PERFUMES", stock: 15, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 6 },
  { id: 92, name: "SNEAKERS", sku: "DAR-092", category: "PERFUMES", stock: 16, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 3 },
  { id: 93, name: "INVICTUS", sku: "DAR-093", category: "PERFUMES", stock: 17, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 4 },
  { id: 94, name: "LADY", sku: "DAR-094", category: "PERFUMES", stock: 18, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 5 },
  { id: 95, name: "WANAWE", sku: "DAR-095", category: "PERFUMES", stock: 19, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 6 },
  { id: 96, name: "ENERGY", sku: "DAR-096", category: "PERFUMES", stock: 20, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 3 },
  { id: 97, name: "LUXURY", sku: "DAR-097", category: "PERFUMES", stock: 21, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 4 },
  { id: 98, name: "FASCIA", sku: "DAR-098", category: "PERFUMES", stock: 8, cost: 3080.0000000000005, salePrice: 5000.0, minStock: 5 },
  { id: 99, name: "BUBBLE GUM", sku: "DAR-099", category: "AROMATIZANTES", stock: 9, cost: 2310.0, salePrice: 3800.0, minStock: 6 },
  { id: 100, name: "DARK SECRET", sku: "DAR-100", category: "AROMATIZANTES", stock: 10, cost: 2310.0, salePrice: 3800.0, minStock: 3 },
  { id: 101, name: "VAINILLA GOLD", sku: "DAR-101", category: "AROMATIZANTES", stock: 11, cost: 2310.0, salePrice: 3800.0, minStock: 4 },
  { id: 102, name: "UVA", sku: "DAR-102", category: "AROMATIZANTES", stock: 12, cost: 2310.0, salePrice: 3800.0, minStock: 5 },
  { id: 103, name: "LIMÓN", sku: "DAR-103", category: "AROMATIZANTES", stock: 13, cost: 2310.0, salePrice: 3800.0, minStock: 6 },
  { id: 104, name: "CHAMPAK", sku: "DAR-104", category: "AROMATIZANTES", stock: 14, cost: 2310.0, salePrice: 3800.0, minStock: 3 },
  { id: 105, name: "ANTI FOG", sku: "DAR-105", category: "SELLADORES", stock: 15, cost: 1870.0000000000002, salePrice: 3100.0, minStock: 4 },
  { id: 106, name: "T1 SEMI PERMANENTE", sku: "DAR-106", category: "SELLADORES", stock: 16, cost: 21450.0, salePrice: 35400.0, minStock: 5 },
  { id: 107, name: "CRISTAL TITANIUM", sku: "DAR-107", category: "SELLADORES", stock: 17, cost: 39600.0, salePrice: 65000.0, minStock: 6 },
  { id: 108, name: "CARNAUBA PURE WAX", sku: "DAR-108", category: "SELLADORES", stock: 18, cost: 11000.0, salePrice: 18000.0, minStock: 3 },
  { id: 109, name: "BALDES", sku: "DAR-109", category: "MERCHANDISING", stock: 19, cost: 7480.000000000001, salePrice: 12000.0, minStock: 4 },
  { id: 110, name: "GRITS", sku: "DAR-110", category: "MERCHANDISING", stock: 20, cost: 7700.000000000001, salePrice: 12000.0, minStock: 5 },
  { id: 111, name: "APLICADORES", sku: "DAR-111", category: "MERCHANDISING", stock: 21, cost: 1375.0, salePrice: 2300.0, minStock: 6 },
  { id: 112, name: "BANDERAS", sku: "DAR-112", category: "MERCHANDISING", stock: 8, cost: 4400.0, salePrice: 7300.0, minStock: 3 },
  { id: 113, name: "BOLSOS", sku: "DAR-113", category: "MERCHANDISING", stock: 9, cost: 12980.000000000002, salePrice: 21500.0, minStock: 4 },
  { id: 114, name: "BOLSOS SUBLIMADOS", sku: "DAR-114", category: "MERCHANDISING", stock: 10, cost: 9680.0, salePrice: 16000.0, minStock: 5 },
  { id: 115, name: "MINI BOLSOS", sku: "DAR-115", category: "MERCHANDISING", stock: 11, cost: 9680.0, salePrice: 16000.0, minStock: 6 },
  { id: 116, name: "BUZOS", sku: "DAR-116", category: "MERCHANDISING", stock: 12, cost: 35200.0, salePrice: 58000.0, minStock: 3 },
  { id: 117, name: "BRUSH TYRE", sku: "DAR-117", category: "MERCHANDISING", stock: 13, cost: 4400.0, salePrice: 7300.0, minStock: 4 },
  { id: 118, name: "SET DE BROCHAS PREMIUM", sku: "DAR-118", category: "MERCHANDISING", stock: 14, cost: 9680.0, salePrice: 16000.0, minStock: 5 },
  { id: 119, name: "SET DE PINCELES", sku: "DAR-119", category: "MERCHANDISING", stock: 15, cost: 9240.0, salePrice: 16000.0, minStock: 6 },
  { id: 120, name: "CEPILLOS LAVA NEUMATICOS", sku: "DAR-120", category: "MERCHANDISING", stock: 16, cost: 4070.0000000000005, salePrice: 6700.0, minStock: 3 },
  { id: 121, name: "CEPILLOS PARA LLANTAS", sku: "DAR-121", category: "MERCHANDISING", stock: 17, cost: 4400.0, salePrice: 7300.0, minStock: 4 },
  { id: 122, name: "GORRAS", sku: "DAR-122", category: "MERCHANDISING", stock: 18, cost: 9900.0, salePrice: 16300.0, minStock: 5 },
  { id: 123, name: "HAND WASH", sku: "DAR-123", category: "MERCHANDISING", stock: 19, cost: 3410.0000000000005, salePrice: 5600.0, minStock: 6 },
  { id: 124, name: "MANOPLAS", sku: "DAR-124", category: "MERCHANDISING", stock: 20, cost: 3410.0000000000005, salePrice: 5600.0, minStock: 3 },
  { id: 125, name: "MICROFIBRAS 40x40", sku: "DAR-125", category: "MERCHANDISING", stock: 21, cost: 2750.0, salePrice: 4500.0, minStock: 4 },
  { id: 126, name: "MICROFIBRAS 80x40", sku: "DAR-126", category: "MERCHANDISING", stock: 8, cost: 4950.0, salePrice: 8200.0, minStock: 5 },
  { id: 127, name: "PADS DE POLIESPUMA", sku: "DAR-127", category: "MERCHANDISING", stock: 9, cost: 1650.0000000000002, salePrice: 2700.0, minStock: 6 },
  { id: 128, name: "PILUSOS", sku: "DAR-128", category: "MERCHANDISING", stock: 10, cost: 9350.0, salePrice: 15500.0, minStock: 3 },
  { id: 129, name: "REMERAS", sku: "DAR-129", category: "MERCHANDISING", stock: 11, cost: 13200.000000000002, salePrice: 21800.0, minStock: 4 },
  { id: 130, name: "SMART MAMUT", sku: "DAR-130", category: "MERCHANDISING", stock: 12, cost: 9900.0, salePrice: 16300.0, minStock: 5 },
  { id: 131, name: "TOALLAS PREMIUM", sku: "DAR-131", category: "MERCHANDISING", stock: 13, cost: 4950.0, salePrice: 8200.0, minStock: 6 },
  { id: 132, name: "TOXIC FOAM", sku: "DAR-132", category: "MERCHANDISING", stock: 14, cost: 44000.0, salePrice: 72000.0, minStock: 3 },
  { id: 133, name: "VASOS", sku: "DAR-133", category: "MERCHANDISING", stock: 15, cost: 4950.0, salePrice: 8200.0, minStock: 4 },
  { id: 134, name: "CHERRY QUICK", sku: "DAR-134", category: "TOXIC GALLON'S COMPANY", stock: 16, cost: 12100.000000000002, salePrice: 20000.0, minStock: 5 },
  { id: 135, name: "WAX", sku: "DAR-135", category: "TOXIC GALLON'S COMPANY", stock: 17, cost: 15180.000000000002, salePrice: 25000.0, minStock: 6 },
  { id: 136, name: "HYPER BLACK", sku: "DAR-136", category: "TOXIC GALLON'S COMPANY", stock: 18, cost: 16390.0, salePrice: 27000.0, minStock: 3 },
  { id: 137, name: "RACCOON CLEAN", sku: "DAR-137", category: "TOXIC GALLON'S COMPANY", stock: 19, cost: 14520.000000000002, salePrice: 24000.0, minStock: 4 },
  { id: 138, name: "ALL REMOVE", sku: "DAR-138", category: "TOXIC GALLON'S COMPANY", stock: 20, cost: 19360.0, salePrice: 32000.0, minStock: 5 },
  { id: 139, name: "ALU WASH", sku: "DAR-139", category: "TOXIC GALLON'S COMPANY", stock: 21, cost: 20680.0, salePrice: 34000.0, minStock: 6 },
  { id: 140, name: "CTRL Z", sku: "DAR-140", category: "TOXIC GALLON'S COMPANY", stock: 8, cost: 18150.0, salePrice: 30000.0, minStock: 3 },
  { id: 141, name: "UVA SHAKE", sku: "DAR-141", category: "TOXIC GALLON'S COMPANY", stock: 9, cost: 26620.000000000004, salePrice: 44000.0, minStock: 4 },
  { id: 142, name: "ALL CLEAN", sku: "DAR-142", category: "TOXIC GALLON'S COMPANY", stock: 10, cost: 12705.000000000002, salePrice: 21000.0, minStock: 5 },
  { id: 143, name: "DARK FLUID", sku: "DAR-143", category: "TOXIC GALLON'S COMPANY", stock: 11, cost: 20350.0, salePrice: 33500.0, minStock: 6 },
  { id: 144, name: "HITS BONES", sku: "DAR-144", category: "TOXIC GALLON'S COMPANY", stock: 12, cost: 15730.000000000002, salePrice: 26000.0, minStock: 3 },
] as const;

const defaultProducts: Product[] = catalogProducts.map((item) => ({
  id: `prod-${item.id}`,
  code: item.sku,
  name: item.name,
  category: item.category,
  stock: item.stock,
  minStock: item.minStock,
  cost: item.cost,
}));

const defaultCustomers: Customer[] = [
  { id: "cli-1", name: "Juan Pérez", phone: "+54 11 5555-1212", notes: "Cliente frecuente" },
  { id: "cli-2", name: "María López", phone: "+54 11 5555-9898", notes: "Entrega en taller" },
];

const defaultSales: Sale[] = [
  {
    id: "sale-1",
    date: new Date().toISOString(),
    productId: "prod-1",
    productName: "Shampoo Automotriz 500ml",
    quantity: 2,
    salePrice: 1800,
    costTotal: 2000,
    customerId: "cli-1",
    customerName: "Juan Pérez",
    total: 3600,
  },
];

export function createInitialState(): AppState {
  return {
    products: defaultProducts,
    customers: defaultCustomers,
    sales: defaultSales,
  };
}

function normalizeState(input: Partial<AppState> | null | undefined): AppState {
  const base = createInitialState();

  if (!input) {
    return base;
  }

  return {
    products: Array.isArray(input.products) ? input.products : base.products,
    customers: Array.isArray(input.customers) ? input.customers : base.customers,
    sales: Array.isArray(input.sales) ? input.sales : base.sales,
  };
}

export async function loadState(): Promise<AppState> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, category, stock, min_stock");

      if (!error && Array.isArray(data) && data.length > 0) {
        return normalizeState({
          products: data.map((item: any) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            category: item.category,
            stock: Number(item.stock ?? 0),
            minStock: Number(item.min_stock ?? 0),
            cost: Number(item.cost ?? 0),
          })),
          customers: [],
          sales: [],
        });
      }
    }
  } catch {
    // Ignorar errores de Supabase y usar fallback local.
  }

  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return createInitialState();
    }

    return normalizeState(JSON.parse(saved));
  } catch {
    return createInitialState();
  }
}

export async function persistState(state: AppState) {
  try {
    if (supabase) {
      await supabase.from("products").upsert(
        state.products.map((product) => ({
          id: product.id,
          code: product.code,
          name: product.name,
          category: product.category,
          stock: product.stock,
          min_stock: product.minStock,
        })),
        { onConflict: "id" },
      );

      await supabase.from("customers").upsert(
        state.customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          notes: customer.notes,
        })),
        { onConflict: "id" },
      );

      await supabase.from("sales").upsert(
        state.sales.map((sale) => ({
          id: sale.id,
          date: sale.date,
          product_id: sale.productId,
          product_name: sale.productName,
          quantity: sale.quantity,
          sale_price: sale.salePrice,
          customer_id: sale.customerId ?? null,
          customer_name: sale.customerName ?? null,
          total: sale.total,
        })),
        { onConflict: "id" },
      );

      return;
    }
  } catch {
    // Si Supabase falla, seguimos guardando en localStorage.
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
