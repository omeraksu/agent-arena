⏺ Workshop Veri Analizi (2026-03-07 Export)

  Genel Bakis

  ┌─────────────────┬──────────┐
  │      Tablo      │  Kayit   │
  ├─────────────────┼──────────┤
  │ activity_events │ 1,000    │
  ├─────────────────┼──────────┤
  │ chat_sessions   │ 48       │
  ├─────────────────┼──────────┤
  │ agent_registry  │ 34       │
  ├─────────────────┼──────────┤
  │ arena_names     │ 29       │
  ├─────────────────┼──────────┤
  │ agent_messages  │ 502      │
  ├─────────────────┼──────────┤
  │ nft_metadata    │ 22       │
  ├─────────────────┼──────────┤
  │ memes           │ 3        │
  ├─────────────────┼──────────┤
  │ rate_limits     │ 0 (bos!) │
  └─────────────────┴──────────┘

  ---
  Event Dagilimi (1,000 event)

  ┌──────────────────┬──────┬───────┐
  │      Event       │ Sayi │   %   │
  ├──────────────────┼──────┼───────┤
  │ agent_registered │ 410  │ 41.0% │
  ├──────────────────┼──────┼───────┤
  │ faucet           │ 238  │ 23.8% │
  ├──────────────────┼──────┼───────┤
  │ quiz_challenge   │ 109  │ 10.9% │
  ├──────────────────┼──────┼───────┤
  │ transfer         │ 70   │ 7.0%  │
  ├──────────────────┼──────┼───────┤
  │ wallet_created   │ 61   │ 6.1%  │
  ├──────────────────┼──────┼───────┤
  │ nft_mint         │ 53   │ 5.3%  │
  ├──────────────────┼──────┼───────┤
  │ agent_message    │ 20   │ 2.0%  │
  ├──────────────────┼──────┼───────┤
  │ diger            │ 39   │ 3.9%  │
  └──────────────────┴──────┴───────┘

  Event'lerin %65'i spam (agent_registered + faucet). Az onceki fix'ler tam olarak bu iki sorunu hedef aliyor.

  ---
  Spam Analizi

  ┌─────────────────────────┬───────────┬─────────┐
  │        Kategori         │  En Kotu  │  Sayi   │
  ├─────────────────────────┼───────────┼─────────┤
  │ Agent registration spam │ omer      │ 109 kez │
  ├─────────────────────────┼───────────┼─────────┤
  │ Faucet spam             │ byte_hawk │ 62 kez  │
  ├─────────────────────────┼───────────┼─────────┤
  │ wallet_created tekrar   │ omer      │ 23 kez  │
  ├─────────────────────────┼───────────┼─────────┤
  │ NFT mint tekrar         │ omer      │ 16 kez  │
  └─────────────────────────┴───────────┴─────────┘

  Top 3 adres (omer, byte_hawk, zencicuzcdan) toplam event'lerin %35.3'unu urettiler.

  ---
  Katilimci Hunisi

  ┌──────────────────┬──────┬───────────┐
  │       Adim       │ Kisi │ Drop-off  │
  ├──────────────────┼──────┼───────────┤
  │ Herhangi event   │ 46   │ -         │
  ├──────────────────┼──────┼───────────┤
  │ Cuzdan olusturma │ 29   │ %37 kayip │
  ├──────────────────┼──────┼───────────┤
  │ Faucet alma      │ 26   │ %10 kayip │
  ├──────────────────┼──────┼───────────┤
  │ Transfer yapma   │ 25   │ %4 kayip  │
  ├──────────────────┼──────┼───────────┤
  │ Agent kayit      │ 31   │ -         │
  ├──────────────────┼──────┼───────────┤
  │ NFT mint         │ 25   │ -         │
  ├──────────────────┼──────┼───────────┤
  │ Tam yolculuk     │ 18   │ -         │
  └──────────────────┴──────┴───────────┘

  29 cuzdandan 18'i (%62) tum adimlari tamamladi — workshop icin iyi bir oran.

  ---
  Transfer Metrikleri

  ┌─────────────────────┬──────────────┐
  │       Metrik        │    Deger     │
  ├─────────────────────┼──────────────┤
  │ Toplam transfer     │ 70           │
  ├─────────────────────┼──────────────┤
  │ Benzersiz gonderici │ 25           │
  ├─────────────────────┼──────────────┤
  │ Toplam AVAX         │ 0.781        │
  ├─────────────────────┼──────────────┤
  │ Ortalama            │ 0.011 AVAX   │
  ├─────────────────────┼──────────────┤
  │ %60'i               │ < 0.005 AVAX │
  └─────────────────────┴──────────────┘

  zencicuzcdan tek basina toplam AVAX'in %62.4'unu (0.487) transfer etti.

  ---
  Agent & Chat

  - 34 kayitli agent, %62'si hacker arketipi
  - 48 chat session, ortalama 7.2 mesaj/session
  - 502 agent-to-agent mesaj — hepsi is_read=False (okuma takibi calismamis)
  - En aktif iletisim: KEP <-> ELLIE (90 mesaj)

  ---
  Kritik Bulgular

  1. rate_limits tablosu bos — backend rate limiting veritabaninda hic calismamis, tum kontrol in-memory kalmis (server restart'ta sifirlaniyor)
  2. agent_registered 410 event — 34 agent icin 410 kayit = ortalama 12x tekrar
  3. Faucet — byte_hawk 62 kez istek atmis, median kullanicinin 4.7x'i
  4. Meme moderasyon — 3 meme'den birinde uygunsuz icerik var
  5. Workshop gunu (7 Mart) — 758 event, %93'u 07:00-10:00 UTC arasinda (3 saatlik yogun oturum)


Ama daha onemli olan sure degil, surenin icindeki dagilim:

  ┌─────────────┬───────┬───────────────────────────────────────┐
  │ Saat (UTC)  │ Event │                 Yorum                 │
  ├─────────────┼───────┼───────────────────────────────────────┤
  │ 07:00-08:00 │ ~150  │ Giris, cuzdan, faucet                 │
  ├─────────────┼───────┼───────────────────────────────────────┤
  │ 08:00-09:00 │ 424   │ Klimaks: agent chat, NFT, transferler │
  ├─────────────┼───────┼───────────────────────────────────────┤
  │ 09:00-10:00 │ ~130  │ Serbest kesif, son mintler            │
  └─────────────┴───────┴───────────────────────────────────────┘

  Bu dagilim aslinda cok iyi bir isaret:

  - Ortada zirve var — ogrenciler 1 saat sonra sikilmamis, aksine en aktif donemlerine girmis
  - Son saatte %17 aktivite — sona dogru tamamen dusmemis, ilgi devam etmis
  - Quiz verisindeki "dikkat suresi 6 dk" endisesine ragmen 3 saat boyunca engagement korunmus

  Karsilastirma perspektifi

  - 45 kayitli ogrenciden 29'u cuzdan olusturdu (%64 katilim)
  - O 29'un 18'i tam yolculugu bitirdi (%62 completion rate)
  - Tipik bir hands-on workshop'ta %40-50 completion beklenir — %62 ortalamanin ustu

  Tek sorun

  Engagement'in bir kismi spam kaynakli. 1000 event'in ~650'si gercek aktivite, ~350'si tekrarli agent_registered + faucet spam. Yani gercek kullanim yoğunluğu gorunenden biraz dusuk ama yine de saglam.

  Kisa cevap: 3 saat, bu yas grubu ve bu icerik icin ideal. Veriler ogrencilerin sikilmadan tum sureci yasadigini gosteriyor.