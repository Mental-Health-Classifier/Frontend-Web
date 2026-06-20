export type Category = "stress" | "depression" | "anxiety";
export type Tier = 1 | 2 | 3;

export interface CrisisContact {
  label: string;
  contact: string;
  note: string;
}

export interface ResourceEntry {
  category: Category;
  tier: Tier;
  tip: string;
  contacts?: CrisisContact[];
}

// Thresholds: tier 1 = 50–65%, tier 2 = 65–80%, tier 3 = >80%
export function getTier(confidence: number): Tier {
  if (confidence > 0.8) return 3;
  if (confidence > 0.65) return 2;
  return 1;
}

const RESOURCES: Record<Category, Record<Tier, string>> = {
  stress: {
    1: "Tubuhmu sedang memberi sinyal bahwa sesuatu perlu diperhatikan. Mulai dari hal kecil: latihan pernapasan diafragma 5 menit setiap pagi atau jalan kaki 20 menit di udara terbuka sudah terbukti menurunkan kadar hormon stres. Menjaga tidur 7 sampai 8 jam dan mengurangi layar satu jam sebelum tidur juga membantu pikiran dan tubuh pulih lebih cepat.",
    2: "Stres di level ini perlu respons yang lebih aktif. Ceritakan apa yang kamu rasakan kepada seseorang yang kamu percaya, karena berbagi beban emosional terbukti secara ilmiah meringankan tekanan. Jika butuh panduan yang lebih terstruktur, aplikasi Riliv menyediakan meditasi terpandu dalam bahasa Indonesia yang bisa dicoba sekarang juga.",
    3: "Tingkat stres ini memerlukan perhatian serius dan kamu tidak harus menghadapinya sendiri. Beritahu orang di sekitarmu tentang kondisi yang sedang dirasakan, hindari membuat keputusan besar saat ini, dan segera pertimbangkan konsultasi dengan psikolog atau psikiater.",
  },
  depression: {
    1: "Perasaan seperti ini memang berat, tapi ada langkah kecil yang bisa membuat perbedaan besar. Coba jadwalkan satu aktivitas yang kamu suka setiap hari, meski hanya 10 menit, karena penelitian menunjukkan bahwa bergerak dulu bisa mengubah perasaan, bukan sebaliknya. Menjaga rutinitas bangun tidur dan makan pada jam yang sama juga membantu tubuh menemukan kestabilannya kembali.",
    2: "Pada tahap ini, berbicara dengan profesional bisa membuat perbedaan yang nyata. Terapi CBT (Cognitive Behavioral Therapy) adalah pendekatan yang paling banyak didukung riset untuk kondisi seperti ini, dan kini bisa diakses dari rumah melalui Riliv atau Halodoc mulai dari Rp 55.000 per sesi. Jangan hadapi ini sendirian karena mengisolasi diri justru memperberat kondisi.",
    3: "Kamu berhak mendapatkan bantuan sekarang, bukan nanti. Jika memiliki BPJS, kunjungi Puskesmas terdekat untuk mendapatkan rujukan ke layanan kesehatan jiwa secara gratis. Beritahu seseorang yang kamu percaya hari ini agar mereka bisa menemanimu melalui proses ini.",
  },
  anxiety: {
    1: "Rasa cemas yang muncul adalah respons alami tubuh, tapi ada cara untuk membantu menenangkannya. Coba teknik grounding 5-4-3-2-1: perhatikan 5 hal yang bisa kamu lihat, 4 yang bisa disentuh, 3 yang bisa didengar, 2 yang bisa dicium, dan 1 yang bisa dirasakan. Latihan pernapasan 4-7-8 yaitu tarik 4 detik, tahan 7 detik, hembuskan 8 detik juga terbukti menenangkan sistem saraf dalam hitungan menit.",
    2: "Kecemasan di level ini bisa terasa menguras energi setiap hari. Terapi CBT adalah pendekatan paling efektif yang direkomendasikan secara klinis dan kini bisa diakses melalui konsultasi online. Aktivitas fisik ringan seperti jalan kaki setiap pagi juga terbukti menurunkan kadar kortisol dan membantu regulasi emosi secara signifikan.",
    3: "Kecemasan seberat ini layak ditangani oleh profesional, dan meminta bantuan adalah tanda keberanian. Jika memiliki BPJS, Puskesmas dapat memberikan rujukan ke layanan kesehatan jiwa secara gratis. Jangan tunda untuk menghubungi seseorang hari ini.",
  },
};

const CRISIS_CONTACTS: CrisisContact[] = [
  { label: "SEJIWA Kemenkes", contact: "119 ext 8", note: "Gratis, 24 jam" },
  { label: "SEJIWA WhatsApp", contact: "+62 813-8007-3120", note: "Alternatif jika telepon penuh" },
  { label: "BISA Helpline", contact: "0811-3855-472", note: "Bilingual, 24 jam" },
  { label: "Yayasan Pulih", contact: "(021) 788-42580", note: "Psikolog klinis" },
  { label: "Puskesmas + BPJS", contact: "Kunjungi langsung", note: "Gratis dengan BPJS, perlu rujukan ke RSJ" },
];

export { CRISIS_CONTACTS };

export function getAllTiersForCategory(category: Category): ResourceEntry[] {
  return ([1, 2, 3] as Tier[]).map((tier) => ({
    category,
    tier,
    tip: RESOURCES[category][tier],
    contacts: tier === 3 ? CRISIS_CONTACTS : undefined,
  }));
}

export function getResources(category: string, confidence: number): ResourceEntry | null {
  const cat = category as Category;
  if (!RESOURCES[cat]) return null;

  const tier = getTier(confidence);
  const tip = RESOURCES[cat][tier];

  return {
    category: cat,
    tier,
    tip,
    contacts: tier === 3 ? CRISIS_CONTACTS : undefined,
  };
}
