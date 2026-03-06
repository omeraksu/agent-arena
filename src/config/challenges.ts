export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Skill {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  intro: string;
  questions: QuizQuestion[];
  xpReward: number;
}

export interface SkillProgress {
  completed: boolean;
  score: number;
  completedAt: string;
}

const STORAGE_KEY = "arena_skills_progress";

export function loadProgress(): Record<string, SkillProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(skillId: string, score: number, total: number) {
  const progress = loadProgress();
  progress[skillId] = {
    completed: true,
    score: Math.round((score / total) * 100),
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export const skills: Skill[] = [
  {
    id: "BLOCKCHAIN_101",
    title: "BLOCKCHAIN_101",
    subtitle: "// temel kavramlar",
    description: "Blockchain nedir, neden önemli, nasıl çalışır?",
    icon: "🔗",
    color: "neon-blue",
    intro:
      "Blockchain, verilerin birbirine bağlı bloklarda saklandığı, kimsenin tek başına değiştiremediği bir dijital defterdir. Sadece kayıt tutmaz — sahipliği kanıtlar, güveni sağlar. Hazırsan başlayalım!",
    xpReward: 100,
    questions: [
      {
        id: "b101_1",
        type: "multiple_choice",
        question: "Blockchain'in en temel özelliği nedir?",
        options: [
          "Verileri çok hızlı işler",
          "Kayıtlar değiştirilemez (immutable)",
          "Sadece Bitcoin için kullanılır",
          "İnternetsiz çalışır",
        ],
        correctIndex: 1,
        explanation:
          "Blockchain'e yazılan veriler değiştirilemez. Bu özelliğe 'immutability' denir ve güvenin temelidir.",
      },
      {
        id: "b101_2",
        type: "multiple_choice",
        question: "Bloklar birbirine nasıl bağlanır?",
        options: [
          "Wi-Fi ile",
          "Her blok, önceki bloğun hash'ini içerir",
          "Şifreler ile",
          "Dosya isimleri ile",
        ],
        correctIndex: 1,
        explanation:
          "Her blok, kendinden önceki bloğun hash'ini (kriptografik parmak izini) taşır. Bu zincir yapısı sayesinde geçmişi değiştirmek imkansız hale gelir.",
      },
      {
        id: "b101_3",
        type: "true_false",
        question: "Blockchain'de verileri değiştirmek için tek bir kişinin onayı yeterlidir.",
        options: ["Doğru", "Yanlış"],
        correctIndex: 1,
        explanation:
          "Yanlış! Blockchain merkeziyetsizdir — verileri değiştirmek için ağdaki çoğunluğun onayı gerekir. Tek bir kişi veya kurum kontrol edemez.",
      },
      {
        id: "b101_4",
        type: "multiple_choice",
        question: "'Merkeziyetsizlik' (decentralization) ne anlama gelir?",
        options: [
          "Tek bir sunucu her şeyi kontrol eder",
          "Veri birçok bilgisayarda kopyalanır, tek nokta kontrolü yok",
          "Sadece devletler kullanabilir",
          "İnternet olmadan çalışır",
        ],
        correctIndex: 1,
        explanation:
          "Merkeziyetsizlik, verinin binlerce bilgisayara dağıtılması demektir. Tek bir nokta çökse bile sistem çalışmaya devam eder.",
      },
      {
        id: "b101_5",
        type: "multiple_choice",
        question: "Blockchain sadece kripto para için mi kullanılır?",
        options: [
          "Evet, sadece Bitcoin için",
          "Hayır — tedarik zinciri, sağlık, oyun, sanat gibi alanlarda da kullanılır",
          "Sadece bankalar kullanır",
          "Sadece NFT için",
        ],
        correctIndex: 1,
        explanation:
          "Blockchain çok daha geniş bir teknoloji! Tedarik zinciri takibi, dijital kimlik, oyun içi eşyalar, sanat ve çok daha fazlası için kullanılır.",
      },
    ],
  },
  {
    id: "WALLET_KEYS",
    title: "WALLET_KEYS",
    subtitle: "// cüzdan & anahtarlar",
    description: "Public key, private key ve cüzdan güvenliği",
    icon: "🔑",
    color: "neon-purple",
    intro:
      "Dijital cüzdanın iki anahtarı var: biri herkese açık (public key), diğeri sadece sana ait (private key). Bu ikisi birlikte blockchain'deki kimliğini oluşturur. Anahtarlarını tanımaya hazır mısın?",
    xpReward: 100,
    questions: [
      {
        id: "wk_1",
        type: "multiple_choice",
        question: "Public key (açık anahtar) ne işe yarar?",
        options: [
          "Cüzdanına giriş yapmak için",
          "Başkalarının sana kripto göndermesi için adres görevi görür",
          "İnternete bağlanmak için",
          "Şifreni değiştirmek için",
        ],
        correctIndex: 1,
        explanation:
          "Public key, cüzdan adresinin temelidir. IBAN gibi düşün — başkalarıyla paylaşabilirsin, sana para göndermelerini sağlar.",
      },
      {
        id: "wk_2",
        type: "true_false",
        question: "Private key'ini (özel anahtarını) arkadaşınla paylaşmak güvenlidir.",
        options: ["Doğru", "Yanlış"],
        correctIndex: 1,
        explanation:
          "Kesinlikle yanlış! Private key'ini paylaşmak = cüzdanını teslim etmek demektir. Kim private key'e sahipse, cüzdandaki tüm varlıkları kontrol eder.",
      },
      {
        id: "wk_3",
        type: "multiple_choice",
        question: "Seed phrase (tohum kelimeler) nedir?",
        options: [
          "Bir oyun şifresi",
          "Private key'in okunabilir hali — cüzdanı kurtarmak için kullanılır",
          "Blockchain'e giriş parolası",
          "NFT'nin ismi",
        ],
        correctIndex: 1,
        explanation:
          "Seed phrase, genellikle 12 veya 24 kelimeden oluşur ve private key'ini yeniden oluşturmana yarar. Kaybedersen cüzdanına bir daha erişemezsin!",
      },
      {
        id: "wk_4",
        type: "multiple_choice",
        question: "Smart wallet (akıllı cüzdan) nedir?",
        options: [
          "Telefonu olan cüzdan",
          "Bir akıllı kontrat tarafından yönetilen, gasless işlem yapabilen cüzdan",
          "Sadece Bitcoin tutan cüzdan",
          "Otomatik para kazandıran cüzdan",
        ],
        correctIndex: 1,
        explanation:
          "Smart wallet, bir akıllı kontrat üzerine kurulu cüzdandır. Account Abstraction sayesinde gas ücreti ödemeden işlem yapabilirsin — tıpkı bu workshop'ta yaptığın gibi!",
      },
    ],
  },
  {
    id: "GAS_COSTS",
    title: "GAS_COSTS",
    subtitle: "// işlem ücretleri",
    description: "Gas nedir, neden ödenir, nasıl sıfırlanır?",
    icon: "⛽",
    color: "neon-yellow",
    intro:
      "Blockchain'de her işlem için 'gas' ücreti ödenir — bu, ağı çalıştıran bilgisayarlara verilen ücrettir. Ama bazı yöntemlerle bu ücreti sıfıra indirebilirsin! Nasıl mı? Öğrenelim.",
    xpReward: 100,
    questions: [
      {
        id: "gc_1",
        type: "multiple_choice",
        question: "Blockchain'de 'gas' ne anlama gelir?",
        options: [
          "Araç yakıtı",
          "İşlemleri gerçekleştirmek için ödenen ücret",
          "Blok büyüklüğü",
          "Cüzdan şifresi",
        ],
        correctIndex: 1,
        explanation:
          "Gas, blockchain'de işlem yapmanın maliyetidir. Arabadaki benzin gibi — ağı çalıştırmak için enerji (ücret) gerekir.",
      },
      {
        id: "gc_2",
        type: "multiple_choice",
        question: "'Gas limit' ve 'gas price' arasındaki fark nedir?",
        options: [
          "İkisi aynı şeydir",
          "Gas limit = max harcama sınırı, gas price = birim fiyat",
          "Gas limit cüzdan limiti, gas price blok fiyatı",
          "Gas limit sadece NFT için, gas price sadece transfer için",
        ],
        correctIndex: 1,
        explanation:
          "Gas limit, işlem için harcamaya razı olduğun maksimum gas miktarı. Gas price ise her bir gas biriminin fiyatı. Toplam ücret = gas limit × gas price.",
      },
      {
        id: "gc_3",
        type: "true_false",
        question: "Gasless (ücretsiz) işlem yapmak teknik olarak mümkündür.",
        options: ["Doğru", "Yanlış"],
        correctIndex: 0,
        explanation:
          "Doğru! Paymaster sistemi sayesinde gas ücretini başka biri (örneğin uygulama geliştiricisi) senin yerine ödeyebilir. Bu workshop'ta yaptığın tüm işlemler aslında gasless!",
      },
      {
        id: "gc_4",
        type: "multiple_choice",
        question: "L2 (Layer 2) ağlar neden daha ucuz?",
        options: [
          "Daha az güvenli oldukları için",
          "İşlemleri toplayıp ana ağa topluca gönderdikleri için",
          "Daha az kullanıcısı olduğu için",
          "Sadece test amaçlı oldukları için",
        ],
        correctIndex: 1,
        explanation:
          "L2 ağlar, birçok işlemi paketleyip (rollup) ana ağa (L1) tek seferde gönderir. Bu sayede işlem maliyeti kullanıcılar arasında paylaşılır ve çok daha ucuz olur.",
      },
    ],
  },
  {
    id: "TX_ANATOMY",
    title: "TX_ANATOMY",
    subtitle: "// işlem anatomisi",
    description: "Bir blockchain işlemi neleri içerir?",
    icon: "🔬",
    color: "neon-green",
    intro:
      "Blockchain'de yaptığın her işlem (transaction) aslında birçok parçadan oluşur: kimden, kime, ne kadar, ne zaman... Bir işlemi parçalarına ayırıp inceleyelim!",
    xpReward: 100,
    questions: [
      {
        id: "tx_1",
        type: "multiple_choice",
        question: "Bir blockchain işlemi (transaction) hangi bilgileri içerir?",
        options: [
          "Sadece gönderen adresi",
          "from, to, value, data, nonce gibi birçok alan",
          "Sadece miktar",
          "Sadece tarih ve saat",
        ],
        correctIndex: 1,
        explanation:
          "Her transaction; gönderen (from), alıcı (to), miktar (value), ek veri (data) ve sıra numarası (nonce) gibi alanlar içerir.",
      },
      {
        id: "tx_2",
        type: "multiple_choice",
        question: "Transaction hash (tx hash) nedir?",
        options: [
          "Cüzdan şifresi",
          "İşlemin benzersiz kimlik numarası — parmak izi gibi",
          "Blok numarası",
          "Gas ücreti",
        ],
        correctIndex: 1,
        explanation:
          "Tx hash, her işlemin eşsiz kimliğidir. Bu hash ile işlemi block explorer'da arayabilir ve detaylarını görebilirsin.",
      },
      {
        id: "tx_3",
        type: "multiple_choice",
        question: "Bir işlem hangi aşamalardan geçer?",
        options: [
          "Gönderildi → Silindi",
          "Pending → Confirmed → Finalized",
          "Başladı → Bitti",
          "Oluşturuldu → İptal edildi",
        ],
        correctIndex: 1,
        explanation:
          "İşlem önce 'pending' (beklemede) olur, sonra bir bloğa dahil edilince 'confirmed' (onaylandı), yeterli blok geçince 'finalized' (kesinleşti) olur.",
      },
      {
        id: "tx_4",
        type: "multiple_choice",
        question: "Block explorer ne işe yarar?",
        options: [
          "Blockchain madenciliği yapmak",
          "Blockchain'deki işlemleri, blokları ve adresleri aramak/görüntülemek",
          "Kripto para satın almak",
          "Cüzdan oluşturmak",
        ],
        correctIndex: 1,
        explanation:
          "Block explorer (örn. Etherscan), blockchain'deki her şeyi şeffaf bir şekilde görüntülemeni sağlar. İşlemler, adresler, kontratlar — hepsi açık!",
      },
      {
        id: "tx_5",
        type: "true_false",
        question: "Bir işlem onaylandıktan sonra geri alınabilir.",
        options: ["Doğru", "Yanlış"],
        correctIndex: 1,
        explanation:
          "Yanlış! Blockchain'deki işlemler geri alınamaz (irreversible). Bu yüzden göndermeden önce adresi iki kez kontrol etmek çok önemlidir.",
      },
    ],
  },
  {
    id: "TOKEN_NFT",
    title: "TOKEN_NFT",
    subtitle: "// token & nft",
    description: "ERC-20, ERC-721 ve dijital sahiplik",
    icon: "🎨",
    color: "neon-pink",
    intro:
      "Token'lar blockchain'deki dijital varlıklardır. Bazıları para gibidir (fungible), bazıları ise benzersizdir (NFT). NFT sadece bir resim değil — sahiplik kanıtıdır! Farkları öğrenelim.",
    xpReward: 100,
    questions: [
      {
        id: "tn_1",
        type: "multiple_choice",
        question: "ERC-20 token nedir?",
        options: [
          "Benzersiz bir dijital sanat eseri",
          "Birbirine eşit, değiştirilebilir (fungible) token standardı",
          "Bir oyun karakteri",
          "Blockchain'in adı",
        ],
        correctIndex: 1,
        explanation:
          "ERC-20, fungible (değiştirilebilir) token standardıdır. Senin 1 token'ın ile benim 1 token'ım tamamen aynıdır — tıpkı para gibi.",
      },
      {
        id: "tn_2",
        type: "multiple_choice",
        question: "NFT (ERC-721) neyi temsil eder?",
        options: [
          "Sadece dijital resim",
          "Benzersiz bir dijital varlığın sahiplik kanıtı",
          "Kripto para birimi",
          "E-posta adresi",
        ],
        correctIndex: 1,
        explanation:
          "NFT = sahiplik kanıtı. Bir NFT dijital sanat, oyun eşyası, etkinlik bileti veya sertifika olabilir. Önemli olan resim değil, sahipliğin blockchain'de kanıtlanmasıdır.",
      },
      {
        id: "tn_3",
        type: "true_false",
        question: "Bir NFT'nin ekran görüntüsünü almak, o NFT'ye sahip olmak demektir.",
        options: ["Doğru", "Yanlış"],
        correctIndex: 1,
        explanation:
          "Kesinlikle yanlış! Mona Lisa'nın fotoğrafını çekmek seni sahibi yapmaz. NFT'de sahiplik blockchain'de kayıtlıdır — ekran görüntüsü sadece bir kopyasıdır.",
      },
      {
        id: "tn_4",
        type: "multiple_choice",
        question: "'Mint' ne demek?",
        options: [
          "NFT'yi silmek",
          "Yeni bir NFT'yi blockchain'e ilk kez yazmak/oluşturmak",
          "NFT'yi başkasına göndermek",
          "NFT'nin fiyatını belirlemek",
        ],
        correctIndex: 1,
        explanation:
          "Mint = ilk kez oluşturmak. Bir NFT mint edildiğinde blockchain'e yazılır ve ilk sahibi belirlenir. Bu workshop'ta agent'ı ikna ederek NFT mint edebilirsin!",
      },
      {
        id: "tn_5",
        type: "multiple_choice",
        question: "Fungible ve non-fungible arasındaki fark nedir?",
        options: [
          "Fungible pahalı, non-fungible ucuz",
          "Fungible = birbirine eşit (para gibi), non-fungible = benzersiz (sanat eseri gibi)",
          "İkisi de aynı anlama gelir",
          "Fungible dijital, non-fungible fiziksel",
        ],
        correctIndex: 1,
        explanation:
          "Fungible: 10 TL bozdurup 2×5 TL alabilirsin, değer aynı kalır. Non-fungible: Her biri benzersiz, biri diğerinin yerini tutamaz — tıpkı orijinal bir tablo gibi.",
      },
    ],
  },
  {
    id: "SECURITY_101",
    title: "SECURITY_101",
    subtitle: "// güvenlik temelleri",
    description: "Blockchain güvenliğinde bilmen gerekenler",
    icon: "🛡️",
    color: "neon-green",
    intro:
      "Blockchain güvenli bir teknoloji, ama kullanıcı olarak senin de dikkat etmen gereken şeyler var. Phishing saldırıları, sahte siteler ve private key güvenliği — temel kuralları öğrenelim!",
    xpReward: 100,
    questions: [
      {
        id: "sec_1",
        type: "true_false",
        question: "Private key'ini kaybedersen, cüzdanını kurtarmanın bir yolu vardır.",
        options: ["Doğru", "Yanlış"],
        correctIndex: 1,
        explanation:
          "Yanlış! Blockchain'de 'şifremi unuttum' butonu yoktur. Private key veya seed phrase'ini kaybedersen, cüzdanındaki varlıklara bir daha erişemezsin.",
      },
      {
        id: "sec_2",
        type: "multiple_choice",
        question: "Phishing saldırısı nedir?",
        options: [
          "Bilgisayara virüs bulaşması",
          "Sahte site veya mesajla kişisel bilgilerini (private key gibi) çalmaya çalışma",
          "Blockchain ağının çökmesi",
          "NFT fiyatının düşmesi",
        ],
        correctIndex: 1,
        explanation:
          "Phishing = oltalama. Saldırganlar gerçek sitelere benzeyen sahte siteler yaparak private key'ini veya seed phrase'ini çalmaya çalışır. URL'yi her zaman kontrol et!",
      },
      {
        id: "sec_3",
        type: "multiple_choice",
        question: "Testnet ve mainnet arasındaki fark nedir?",
        options: [
          "İkisi de aynıdır",
          "Testnet = deneme ağı (gerçek para yok), mainnet = gerçek ağ (gerçek değer)",
          "Testnet daha güvenli",
          "Mainnet sadece şirketler için",
        ],
        correctIndex: 1,
        explanation:
          "Testnet, geliştiricilerin ve öğrencilerin denemeler yapabileceği test ağıdır — buradaki token'ların gerçek değeri yoktur. Bu workshop'ta testnet kullanıyoruz!",
      },
      {
        id: "sec_4",
        type: "multiple_choice",
        question: "Bir smart contract'a 'approve' (onay) vermek ne anlama gelir?",
        options: [
          "Kontratı beğenmek",
          "Kontrata, cüzdanındaki belirli token'ları kullanma izni vermek",
          "Kontratı silmek",
          "Yeni bir cüzdan oluşturmak",
        ],
        correctIndex: 1,
        explanation:
          "Approve, bir kontrata token'larını harcama izni verir. Güvenilmeyen bir kontrata sınırsız onay vermek tehlikelidir — neyi onayladığını her zaman kontrol et!",
      },
    ],
  },
];
