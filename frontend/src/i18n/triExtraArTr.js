// Dizionario starter AR/TR per le stringhe UI ad alta frequenza (chiave = sorgente IT).
// Le stringhe non presenti ricadono su EN (fallback dignitoso). Espandibile.
const AR = {
  "Ricette": "الوصفات", "Ricettario": "دفتر الوصفات", "Produzione": "الإنتاج", "Magazzino": "المخزن",
  "Magazzino & Scorte": "المخزن والمؤن", "Piano": "الخطة", "Impasto": "العجين", "Forno": "الفرن",
  "Bilancia": "الميزان", "Bilancia Guidata": "الميزان الموجّه", "Salva": "حفظ", "Annulla": "إلغاء",
  "Avanti": "التالي", "Indietro": "رجوع", "Chiudi": "إغلاق", "Conferma": "تأكيد", "Cerca": "بحث",
  "Cerca la tua lingua…": "ابحث عن لغتك…", "Operatore": "المشغّل", "Accedi": "تسجيل الدخول",
  "Reparto": "القسم", "Panificazione": "المخبز", "Pasticceria": "الحلويات", "Tutti": "الكل",
  "Radar Impianto": "رادار المصنع", "Compliance UE/DE": "الامتثال الأوروبي/الألماني", "Sicurezza": "السلامة",
  "Cambia postazione": "تغيير المحطة", "Parla": "تحدّث", "Governa a voce": "تحكّم بالصوت",
};
const TR = {
  "Ricette": "Tarifler", "Ricettario": "Tarif kitabı", "Produzione": "Üretim", "Magazzino": "Depo",
  "Magazzino & Scorte": "Depo ve Stok", "Piano": "Plan", "Impasto": "Hamur", "Forno": "Fırın",
  "Bilancia": "Terazi", "Bilancia Guidata": "Rehberli terazi", "Salva": "Kaydet", "Annulla": "İptal",
  "Avanti": "İleri", "Indietro": "Geri", "Chiudi": "Kapat", "Conferma": "Onayla", "Cerca": "Ara",
  "Cerca la tua lingua…": "Dilini ara…", "Operatore": "Operatör", "Accedi": "Giriş",
  "Reparto": "Bölüm", "Panificazione": "Ekmek", "Pasticceria": "Pastane", "Tutti": "Tümü",
  "Radar Impianto": "Tesis radarı", "Compliance UE/DE": "AB/DE Uyumluluk", "Sicurezza": "Güvenlik",
  "Cambia postazione": "İstasyon değiştir", "Parla": "Konuş", "Governa a voce": "Sesle yönet",
};
export const triAR = (it) => (it != null ? AR[it] : undefined);
export const triTR = (it) => (it != null ? TR[it] : undefined);
