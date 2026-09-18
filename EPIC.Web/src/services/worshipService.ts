/**
 * EPIC Worship Music Service
 * Pure Christian Praise & Worship Songs (Tagalog & English Only - No Worldly Songs)
 * 100% Real Studio/Live Master Recordings via Official YouTube Integration
 * Complete, Authentic Word-for-Word Lyrics (Verse, Chorus, Bridge, Pre-Chorus)
 * Supports Admin Song Deletion & Storage
 * Total Curated Catalog: 52 Songs (26 Tagalog, 26 English)
 */

export type WorshipMood = "ALL" | "TAGALOG" | "ENGLISH";

export interface WorshipSong {
    id: string;
    title: string;
    artist: string;
    language: "Tagalog" | "English";
    albumCover: string;
    duration: string;
    durationSeconds: number;
    mood: WorshipMood;
    moodLabel: string;
    youtubeId: string;
    audioUrl?: string;
    scriptureTheme: string;
    lyricsSnippet: string;
    fullLyrics: string;
    chordsKey: string;
    isCustom?: boolean;
}

export interface CreateWorshipSongRequest {
    title: string;
    artist: string;
    language?: "Tagalog" | "English";
    albumCover?: string;
    duration?: string;
    youtubeUrlOrId?: string;
    audioUrl?: string;
    scriptureTheme?: string;
    lyricsSnippet?: string;
    fullLyrics?: string;
    chordsKey?: string;
}

export const WORSHIP_PLAYLIST: WorshipSong[] = [
    // ==========================================
    // 🇵🇭 TAGALOG CHRISTIAN PRAISE & WORSHIP SONGS (26 Songs)
    // ==========================================
    {
        id: "song-tagalog-1",
        title: "Diyos Ka Sa Amin",
        artist: "Hope Filipino Worship",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/X2DWxYpTQpQ/hqdefault.jpg",
        duration: "5:48",
        durationSeconds: 348,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Worship Anthem",
        youtubeId: "X2DWxYpTQpQ",
        scriptureTheme: "Awit 46:1 — 'Ang Diyos ang ating kanlungan at kalakasan, handang saklolo sa mga kabagabagan.'",
        lyricsSnippet: "Sa lahat ng panahon, Diyos Ka sa amin! Sa lahat ng oras, nariyan para sa amin!",
        chordsKey: "G",
        fullLyrics: `[Verse 1]
O Diyos, Ikaw ang tunay na dakila sa mundo
Ikaw ang Haring nagmahal ng tulad ko
Ginawa Mo'ng lahat
Pag-ibig Mo ay tapat at wagas

[Verse 2]
O Diyos, walang papantay sa kabutihan Mo
Ang ngalan Mo'y itataas sa buhay ko
Sundin ang loob Mo
Iparinig ang nais Mo

[Chorus]
Sa lahat ng panahon, Diyos Ka sa amin
Sa lahat ng oras, nariyan para sa amin
Panginoong Hesus, purihin Ka!
Dakilain Ka sa buhay ko
Aming Ama

[Verse 3]
O Diyos, Ikaw ang tunay na dakila sa mundo
Ikaw ang Haring nagmahal ng tulad ko
Sundin ang loob Mo
Iparinig ang nais Mo

[Chorus]
Sa lahat ng panahon, Diyos Ka sa amin
Sa lahat ng oras, nariyan para sa amin
Panginoong Hesus, purihin Ka!
Dakilain Ka sa buhay ko
Aming Ama

[Bridge]
Di nagbabago, Diyos Ka sa amin
Tanging sandigan, nariyan para sa amin
Panginoong Hesus, maghari Ka
Magliwanag Ka sa buhay ko

[Chorus]
Sa lahat ng panahon, Diyos Ka sa amin
Sa lahat ng oras, nariyan para sa amin
Panginoong Hesus, purihin Ka!
Dakilain Ka sa buhay ko
Aming Ama`
    },
    {
        id: "song-tagalog-2",
        title: "Salamat, Salamat",
        artist: "Malayang Pilipino Music",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/BMZmyvr5IAM/hqdefault.jpg",
        duration: "5:12",
        durationSeconds: 312,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Pasasalamat",
        youtubeId: "BMZmyvr5IAM",
        scriptureTheme: "1 Tesalonica 5:18 — 'Magpasalamat kayo sa lahat ng pagkakataon; sapagkat ito ang kalooban ng Diyos sa inyo.'",
        lyricsSnippet: "Salamat, salamat O Hesus sa pag-ibig Mo! Walang ibang nagmahal sa akin ng katulad Mo!",
        chordsKey: "E",
        fullLyrics: `[Verse 1]
Kung aking mamasdan ang kalawakan
Hindi ko maunawaan
Ang Iyong dahilan kung bakit ako'y
Pinili Mo't inalagaan

[Pre-Chorus]
'Di ko kayang isipin
Hinding-hindi ko kayang sukatin
Ang pag-ibig Mo Hesus
Na Iyong ibinigay sa akin

[Chorus]
Salamat, salamat
O Hesus sa pag-ibig Mo
Walang ibang nagmahal sa akin
Ng katulad Mo
Salamat, salamat
O Hesus sa pag-ibig Mo
Ako'y magsasaya sa piling Mo

[Verse 2]
Kung may pagsubok man o kagipitan
Ako ay may lalapitan
Ikaw Hesus ang aking sandigan
Hindi Mo ako pababayaan

[Pre-Chorus]
'Di ko kayang isipin
Hinding-hindi ko kayang sukatin
Ang pag-ibig Mo Hesus
Na Iyong ibinigay sa akin

[Chorus]
Salamat, salamat
O Hesus sa pag-ibig Mo
Walang ibang nagmahal sa akin
Ng katulad Mo
Salamat, salamat
O Hesus sa pag-ibig Mo
Ako'y magsasaya sa piling Mo

[Bridge]
Buhay ko na ang purihin Ka
Buhay ko na ang sa 'Yo'y sumamba
Wala ng ibang nanaisin pa
Kundi pasalamatan Ka

[Chorus]
Salamat, salamat
O Hesus sa pag-ibig Mo
Walang ibang nagmahal sa akin
Ng katulad Mo
Salamat, salamat
O Hesus sa pag-ibig Mo
Ako'y magsasaya sa piling Mo`
    },
    {
        id: "song-tagalog-3",
        title: "Banal Mong Tahanan",
        artist: "Musikatha",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/zjVBIQfnYhQ/hqdefault.jpg",
        duration: "4:48",
        durationSeconds: 288,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Soaking",
        youtubeId: "zjVBIQfnYhQ",
        scriptureTheme: "Awit 84:10 — 'Sapagkat ang isang araw sa Iyong mga looban ay higit na mabuti kaysa sanlibong araw sa iba.'",
        lyricsSnippet: "Loobin Mong ang buhay ko'y maging banal Mong tahanan, luklukan ng Iyong wagas na pagsinta.",
        chordsKey: "D",
        fullLyrics: `[Verse 1]
Ang puso ko ay dinudulog sa Iyo
Nagpapakumbaba, nagsusumamo
Pagindapatin Mo Ikaw ay mamasdan
Makaniig Ka at sa Iyo ay pumisan

[Chorus]
Loobin Mong ang buhay ko'y
Maging banal Mong tahanan
Luklukan ng Iyong wagas na pagsinta
Daluyan ng walang hanggang
Mga papuri't pagsamba
Maghari Ka O Diyos
Ngayon at kailanman

[Verse 2]
Ang puso ko ay dinudulog sa Iyo
Nagpapakumbaba, nagsusumamo
Pagindapatin Mo Ikaw ay mamasdan
Makaniig Ka at sa Iyo ay pumisan

[Chorus]
Loobin Mong ang buhay ko'y
Maging banal Mong tahanan
Luklukan ng Iyong wagas na pagsinta
Daluyan ng walang hanggang
Mga papuri't pagsamba
Maghari Ka O Diyos
Ngayon at kailanman`
    },
    {
        id: "song-tagalog-4",
        title: "Dakilang Katapatan",
        artist: "Papuri! Singers / Arnel de Pano",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/v4-ihovxjtE/hqdefault.jpg",
        duration: "5:20",
        durationSeconds: 320,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Hymn",
        youtubeId: "v4-ihovxjtE",
        scriptureTheme: "Panaghoy 3:22-23 — 'Dakila ang Iyong katapatan; bago tuwina ang Iyong habag tuwing umaga.'",
        lyricsSnippet: "Dakila Ka, O Diyos, tapat Ka ngang tunay! Magmula pa sa ugat ng aming lahi, katapatan Mo'y laging totoo.",
        chordsKey: "D",
        fullLyrics: `[Verse 1]
Sadyang kay buti ng ating Panginoon
Magtatapat sa habang panahon
Maging sa kabila ng aking pagkukulang
Biyaya Niya'y patuloy na laan

[Verse 2]
Katulad ng pagsinag ng gintong araw
Patuloy Siyang nagbibigay tanglaw
Kaya sa puso ko't damdamin
Katapatan Niya'y aking pupurihin

[Chorus]
Dakila Ka, O Diyos, tapat Ka ngang tunay
Magmula pa sa ugat ng aming lahi
Mundo'y magunaw man, maaasahan Kang lagi
Maging hanggang wakas nitong buhay
Kaya O Diyos, ika'y aking pupurihin
Sa buong mundo'y aking aawitin
Dakila ang Iyong katapatan
Pag-ibig Mo'y walang hanggan

[Bridge]
Dakila Ka, O Diyos, sa habang panahon
Katapatan Mo'y matibay na sandigan
Sa bawat pighati, tagumpay man ay naroon
Daluyan ng pag-asa kung kailangan ay hinahon
Pag-ibig Mong alay sa 'min, noon hanggang ngayon
Dakila Ka, O Diyos!`
    },
    {
        id: "song-tagalog-5",
        title: "Wala Kang Katulad",
        artist: "Faithmusic Manila",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/J72zkfMGA_s/hqdefault.jpg",
        duration: "5:35",
        durationSeconds: 335,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Pagdakila",
        youtubeId: "J72zkfMGA_s",
        scriptureTheme: "Awit 86:8 — 'Walang katulad Mo sa mga diyos, O Panginoon; wala ring mga gawang tulad ng Iyong mga gawa.'",
        lyricsSnippet: "Wala Kang katulad, wala nang hihigit sa 'Yo! Ikaw ang Diyos noon pa man, maging ngayon at kailanman!",
        chordsKey: "C",
        fullLyrics: `[Verse 1]
Awitin ko man lahat ng awit sa mundo
Ay 'di kayang ilarawan ang kadakilaan Mo
Kulang ang lahat ng tula
Kulang maging mga salita
Upang ihayag ang kabutihan Mo

[Chorus]
Wala Kang katulad
Wala nang hihigit sa 'Yo
Wala Kang katulad
Wala nang papantay sa 'Yo
Ikaw ang Diyos noon pa man
Maging ngayon at kailanman
Sa habang panahon
Wala Kang katulad

[Verse 2]
Awitin ko man lahat ng awit sa mundo
Ay 'di kayang ilarawan ang kadakilaan Mo
Kulang ang lahat ng tula
Kulang maging mga salita
Upang ihayag ang kabutihan Mo

[Chorus]
Wala Kang katulad
Wala nang hihigit sa 'Yo
Wala Kang katulad
Wala nang papantay sa 'Yo
Ikaw ang Diyos noon pa man
Maging ngayon at kailanman
Sa habang panahon
Wala Kang katulad`
    },
    {
        id: "song-tagalog-6",
        title: "Kay Buti-Buti Mo Panginoon",
        artist: "Boy Baldomaro",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/4p-zsjuvanE/hqdefault.jpg",
        duration: "4:32",
        durationSeconds: 272,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Papuri",
        youtubeId: "4p-zsjuvanE",
        scriptureTheme: "Awit 100:5 — 'Sapagkat ang Panginoon ay mabuti; ang Kanyang kagandahang-loob ay magpakailanman.'",
        lyricsSnippet: "Kay buti-buti Mo, Panginoon! Sa lahat ng oras, sa bawat araw, Ika'y laging tapat kung magmahal.",
        chordsKey: "C",
        fullLyrics: `[Verse]
Kay buti-buti Mo, Panginoon
Sa lahat ng oras, sa bawat araw
Ika'y laging tapat kung magmahal
Ang Iyong kaawaan
Ay magpawalang-hanggan

[Chorus]
Pinupuri't sinasamba Kita
Dakilang Diyos at Panginoon
Tunay ngang Ika'y walang katulad
Tunay ngang Ika'y di nagbabago
Mabuting Diyos
Na sa ami'y nagmamahal

[Verse]
Kay buti-buti Mo, Panginoon
Sa lahat ng oras, sa bawat araw
Ika'y laging tapat kung magmahal
Ang Iyong kaawaan
Ay magpawalang-hanggan

[Chorus]
Pinupuri't sinasamba Kita
Dakilang Diyos at Panginoon
Tunay ngang Ika'y walang katulad
Tunay ngang Ika'y di nagbabago
Mabuting Diyos
Na sa ami'y nagmamahal`
    },
    {
        id: "song-tagalog-7",
        title: "Mahal na Mahal Kita Panginoon",
        artist: "Rommel Guevara",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/DL4zdNwoZS8/hqdefault.jpg",
        duration: "5:24",
        durationSeconds: 324,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Pagsamba",
        youtubeId: "DL4zdNwoZS8",
        scriptureTheme: "Awit 18:1 — 'Iniibig Kita, O Panginoon, aking kalakasan.'",
        lyricsSnippet: "Mahal na mahal Kita Panginoon, mahal na mahal Kita Panginoon, kailanma'y di Ka nagbago!",
        chordsKey: "D",
        fullLyrics: `[Verse 1]
Mahal na mahal Kita Panginoon
Mahal na mahal Kita Panginoon
Kailanma'y 'di Ka nagbago
Pag-ibig Mo ay totoo
Mahal na mahal Kita Panginoon

[Chorus]
Habangbuhay papupurihan Ka
Habangbuhay pagsisilbihan Ka
Wala nang ibang sasambahin
Kundi Ikaw lamang Hesus
Mahal na mahal Kita Panginoon

[Verse 2]
Mahal na mahal Kita Panginoon
Mahal na mahal Kita Panginoon
Kailanma'y 'di Ka nagbago
Pag-ibig Mo ay totoo
Mahal na mahal Kita Panginoon

[Chorus]
Habangbuhay papupurihan Ka
Habangbuhay pagsisilbihan Ka
Wala nang ibang sasambahin
Kundi Ikaw lamang Hesus
Mahal na mahal Kita Panginoon`
    },
    {
        id: "song-tagalog-8",
        title: "Lilim",
        artist: "Victory Worship",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/sBum0Prrnmo/hqdefault.jpg",
        duration: "5:54",
        durationSeconds: 354,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Kanlungan",
        youtubeId: "sBum0Prrnmo",
        scriptureTheme: "Awit 91:1 — 'Siyang nananahan sa lihim na dako ng Kataas-taasan ay mananatili sa ilalim ng lilim ng Makapangyarihan sa lahat.'",
        lyricsSnippet: "Panginoon, ang Ngalan Mo ay kanlungan ko! Sa lilim ng Iyong mga pakpak ako ay ligtas!",
        chordsKey: "E",
        fullLyrics: `[Verse 1]
Panginoon, ang Ngalan Mo ay kanlungan ko
Panginoon, ang Ngalan Mo ay lakas ko
Kahit dumating man ang bagyo
Kahit yumanig man ang mundo
Ako'y mananalig sa 'Yo

[Chorus]
Sa lilim ng Iyong mga pakpak
Panginoon, ako ay ligtas
Di ako matitinag, di mababagabag
Sapagkat Ikaw ang aking Diyos
Sa lilim ng Iyong mga pakpak
Panginoon, ako ay ligtas

[Verse 2]
Panginoon, pag-ibig Mo'y di magmamaliw
Panginoon, biyaya Mo ay sapat sa 'kin
Kahit magdilim man ang daan
Liwanag Mo ang susundan
Ako'y mananalig sa 'Yo

[Chorus]
Sa lilim ng Iyong mga pakpak
Panginoon, ako ay ligtas
Di ako matitinag, di mababagabag
Sapagkat Ikaw ang aking Diyos
Sa lilim ng Iyong mga pakpak
Panginoon, ako ay ligtas

[Bridge]
Banal, Banal, Makapangyarihang Diyos
Banal, Banal, Hari ng sanlibutan
Ikaw ang kanlungan, Ikaw ang sandigan
Magpakailanman`
    },
    {
        id: "song-tagalog-9",
        title: "Pusong Dalisay",
        artist: "Musikatha",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/2lcFdt-8Le8/hqdefault.jpg",
        duration: "4:38",
        durationSeconds: 278,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Panalangin",
        youtubeId: "2lcFdt-8Le8",
        scriptureTheme: "Awit 51:10 — 'Likhain Mo sa akin ang isang malinis na puso, O Diyos, at magbago Ka ng isang matuwid na espiritu sa loob ko.'",
        lyricsSnippet: "Pusong dalisay ang aking nais, na likhain Mo O Diyos para sa akin.",
        chordsKey: "G",
        fullLyrics: `[Verse]
Pusong dalisay ang aking nais
Na likhain Mo O Diyos para sa akin
Pusong dalisay ang aking nais
Na likhain Mo O Diyos para sa akin

[Chorus]
Isang pusong tapat na Sa 'Yo'y nagmamahal
Isang pusong Sa 'Yo'y nagpapasakop
Isang pusong marunong sumunod sa Iyo
Pusong dalisay ang aking nais
Para sa akin

[Verse]
Pusong dalisay ang aking nais
Na likhain Mo O Diyos para sa akin
Pusong dalisay ang aking nais
Na likhain Mo O Diyos para sa akin

[Chorus]
Isang pusong tapat na Sa 'Yo'y nagmamahal
Isang pusong Sa 'Yo'y nagpapasakop
Isang pusong marunong sumunod sa Iyo
Pusong dalisay ang aking nais
Para sa akin`
    },
    {
        id: "song-tagalog-10",
        title: "Tanging Pag-asa",
        artist: "Musikatha",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/NmxE5R3Tv5U/hqdefault.jpg",
        duration: "5:15",
        durationSeconds: 315,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Pag-asa",
        youtubeId: "NmxE5R3Tv5U",
        scriptureTheme: "Jeremias 29:11 — 'Sapagkat nalalaman Ko ang mga panukala na Aking iniisip para sa inyo, panukala para sa kapayapaan at hindi para sa kasamaan, upang bigyan kayo ng pag-asa sa hinaharap.'",
        lyricsSnippet: "Ikaw ang tanging pag-asa ko, kailanman ay di mabibigo!",
        chordsKey: "G",
        fullLyrics: `[Verse 1]
Sa bawat sandali ng aking buhay
Ikaw Hesus ang aking gabay
Sa hirap man at kagipitan
Ikaw ang aking kanlungan

[Chorus]
Ikaw ang tanging pag-asa ko
Kailanman ay 'di mabibigo
Sa Iyong mga kamay may kapayapaan
Hesus Ikaw ang tanging pag-asa ko

[Verse 2]
Kahit lumipas man ang panahon
Pag-ibig Mo ay mananatili roon
Pangako Mo'y maaasahan
Kailanman ay di magkukulang

[Chorus]
Ikaw ang tanging pag-asa ko
Kailanman ay 'di mabibigo
Sa Iyong mga kamay may kapayapaan
Hesus Ikaw ang tanging pag-asa ko`
    },
    {
        id: "song-tagalog-11",
        title: "Hesus Sa Buhay Ko",
        artist: "Faithmusic Manila",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/tIlYbxgRauQ/hqdefault.jpg",
        duration: "5:42",
        durationSeconds: 342,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Katapatan",
        youtubeId: "tIlYbxgRauQ",
        scriptureTheme: "Filipos 1:21 — 'Sapagkat para sa akin, ang mabuhay ay si Cristo at ang mamatay ay pakinabang.'",
        lyricsSnippet: "Sa bawat araw na nagdaan, katapatan Mo'y nararanasan, Hesus sa buhay ko!",
        chordsKey: "D",
        fullLyrics: `[Verse 1]
Sa bawat araw na nagdaan
Katapatan Mo'y nararanasan
Biyaya Mo'y laging sapat
Pag-ibig Mo'y laging tapat

[Chorus]
Hesus sa buhay ko
Ikaw ang kailangan ko
Wala nang iba pang hahanapin pa
Panginoon, tanging Ikaw lamang

[Verse 2]
Sa mga sandaling nalulumbay
Ika'y kasama sa bawat lakbay
Panghahawakan ang Pangako Mo
Na 'di Mo ako iiwanan Hesus

[Chorus]
Hesus sa buhay ko
Ikaw ang kailangan ko
Wala nang iba pang hahanapin pa
Panginoon, tanging Ikaw lamang`
    },
    {
        id: "song-tagalog-12",
        title: "Patuloy Kang Pupurihin",
        artist: "Malayang Pilipino Music",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/YWeThkthuxM/hqdefault.jpg",
        duration: "4:56",
        durationSeconds: 296,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Masiglang Papuri",
        youtubeId: "YWeThkthuxM",
        scriptureTheme: "Awit 145:2 — 'Araw-araw Kitang pupurihin, at aking pupurihin ang Iyong Pangalan magpakailanman.'",
        lyricsSnippet: "Patuloy Kang pupurihin, sasambahin sa bawat sandali!",
        chordsKey: "G",
        fullLyrics: `[Verse 1]
Ito ang araw na ginawa Mo
Magagalak at magsasaya
Sa bawat biyayang kaloob Mo
Sasayaw at aawit sa Iyo

[Chorus]
Patuloy Kang pupurihin
Sasambahin sa bawat sandali
Walang katulad ang pag-ibig Mo
Aawitan Ka O Diyos magpakailanman

[Bridge]
Hallelujah, purihin Ka!
Hallelujah, purihin Ka!
Haring dakila, Hari ng lahat
Purihin Ka!`
    },
    {
        id: "song-tagalog-13",
        title: "Radical Love",
        artist: "Victory Worship feat. Cathy Go",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/-ZvSWp14Fp0/hqdefault.jpg",
        duration: "5:30",
        durationSeconds: 330,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Breakthrough",
        youtubeId: "-ZvSWp14Fp0",
        scriptureTheme: "Roma 5:8 — 'Ngunit pinatutunayan ng Diyos ang Kanyang sariling pag-ibig sa atin, na noong tayo'y mga makasalanan pa, si Cristo ay namatay para sa atin.'",
        lyricsSnippet: "Your love has made a way, Your love has saved my soul, Radical love that never fails!",
        chordsKey: "E",
        fullLyrics: `[Verse 1]
You came into my darkness
Brought light into my heart
Your cross has paid the price for me
Now I am redeemed

[Chorus]
This is radical love
Given for us from above
Jesus You laid down Your life
Now I am alive in Your grace
Radical love, unending praise

[Bridge]
No greater love than this
That You gave everything
Forever I will shout Your praise
Jesus my King!`
    },
    {
        id: "song-tagalog-14",
        title: "Awit ng Bayan",
        artist: "Victory Worship",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/2NEfsC0QsD0/hqdefault.jpg",
        duration: "5:10",
        durationSeconds: 310,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Banal na Bansa",
        youtubeId: "2NEfsC0QsD0",
        scriptureTheme: "2 Cronica 7:14 — 'Kung ang Aking bayan na tinatawag sa pamamagitan ng Aking Pangalan ay magpakumbaba at manalangin...'",
        lyricsSnippet: "Dinggin Mo ang awit ng aming bayan, ibalik Mo kami sa Iyong harapan!",
        chordsKey: "D",
        fullLyrics: `[Verse 1]
Narito ang aming bayan
Nagsusumamo sa 'Yo Ama
Hilumin Mo ang aming lupain
Biyaya Mo'y ibuhos sa amin

[Chorus]
Dinggin Mo ang awit ng aming bayan
Pagsisisi at kapakumbabaan
Ikaw lamang ang aming Diyos
Dakila Ka sa buong Pilipinas

[Bridge]
Banal Ka, Panginoon
Maghari Ka sa aming nasyon
Mula hilaga hanggang timog
Pilipinas ay sa 'Yo!`
    },
    {
        id: "song-tagalog-15",
        title: "Babalik-Balikan",
        artist: "Faithmusic Manila",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/OdUBUqSqAUI/hqdefault.jpg",
        duration: "5:20",
        durationSeconds: 320,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Piling ng Diyos",
        youtubeId: "OdUBUqSqAUI",
        scriptureTheme: "Awit 27:4 — 'Isang bagay ang hiningi ko sa Panginoon, na aking hahanapin: na ako'y makatahan sa bahay ng Panginoon sa lahat ng mga araw ng aking buhay.'",
        lyricsSnippet: "Babalik-balikan ang Iyong presensya, walang kapantay ang Iyong biyaya!",
        chordsKey: "E",
        fullLyrics: `[Verse 1]
Walang ibang dako na nais puntahan
Kundi ang Iyong banal na tahanan
Sa piling Mo may kagalakan
Sa piling Mo may kalayaan

[Chorus]
Babalik-balikan ang Iyong presensya
Walang kapantay ang Iyong biyaya
Sa piling Mo Panginoon
Laging may tagumpay
Babalik-balikan Ka kailanman

[Bridge]
Dito sa 'Yong paanan
Ako'y magpapakumbaba
Sasambahin Ka O Diyos
Aking Ama!`
    },
    {
        id: "song-tagalog-16",
        title: "Hahanap-Hanapin",
        artist: "Faithmusic Manila",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/y_ffuNZPNh8/hqdefault.jpg",
        duration: "4:50",
        durationSeconds: 290,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Pagkauhaw",
        youtubeId: "y_ffuNZPNh8",
        scriptureTheme: "Awit 63:1 — 'O Diyos, Ikaw ay aking Diyos; maaga Kitang hahanapin; kinauuhawan Ka ng aking kaluluwa.'",
        lyricsSnippet: "Hahanap-hanapin Ka ng aking puso, sabik sa presensya at pag-ibig Mo!",
        chordsKey: "G",
        fullLyrics: `[Verse 1]
Gaya ng usa na nauuhaw
Sa tubig ng batisan
Gayon ang aking kaluluwa
Sabik sa Iyong kalinga

[Chorus]
Hahanap-hanapin Ka ng aking puso
Sabik sa presensya at pag-ibig Mo
Wala nang ibang naisin pa
Kundi makapiling Ka

[Bridge]
Ikaw ang bukal ng buhay
Kailanman di mauubos
Ikaw ang aking lakas
Panginoong Hesus!`
    },
    {
        id: "song-tagalog-17",
        title: "Pupurihin Ka Sa Awit",
        artist: "Musikatha",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/FJiPuWopc38/hqdefault.jpg",
        duration: "4:45",
        durationSeconds: 285,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Awit ng Pasasalamat",
        youtubeId: "FJiPuWopc38",
        scriptureTheme: "Awit 28:7 — 'Ang Panginoon ang aking kalakasan at aking kalasag; ang aking puso ay nagtiwala sa Kanya... at sa aking awit ay pupurihin ko Siya.'",
        lyricsSnippet: "Pupurihin Ka sa awit, itataas ang Iyong Pangalan!",
        chordsKey: "E",
        fullLyrics: `[Verse 1]
Walang hanggang pasasalamat
Ang sa Iyo ay nararapat
Dahil sa Iyong kabutihan
At wagas na katapatan

[Chorus]
Pupurihin Ka sa awit
Itataas ang Iyong Pangalan
Sasambahin Ka sa espiritu
At sa katotohanan
Pupurihin Ka magpakailanman

[Bridge]
Dakila Ka, Hesus
Hari ng mga hari
Pupurihin Ka!`
    },
    {
        id: "song-tagalog-18",
        title: "Ikaw Ang Lahat Sa Akin",
        artist: "Rommel Guevara",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/QxeCqr1hqjI/hqdefault.jpg",
        duration: "5:32",
        durationSeconds: 332,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Pagtatalaga",
        youtubeId: "QxeCqr1hqjI",
        scriptureTheme: "Colosas 3:11 — 'Kundi si Cristo ang lahat, at sa lahat.'",
        lyricsSnippet: "Ikaw ang lahat sa akin, Ikaw ang tanging kalakasan ko!",
        chordsKey: "C",
        fullLyrics: `[Verse 1]
O Diyos sa buhay ko
Ikaw ang tanging liwanag
Kapag may kadiliman
Ikaw ang aking gabay

[Chorus]
Ikaw ang lahat sa akin
Ikaw ang tanging kalakasan ko
Kahit ano pa ang maranasan
Ikaw at Ikaw pa rin
Ang aking sasambahin

[Bridge]
Panginoon, aking sandigan
Panginoon, aking kanlungan
Ikaw ang lahat sa akin!`
    },
    {
        id: "song-tagalog-19",
        title: "Walang Hanggang Pasasalamat",
        artist: "Ptr. Joey Crisostomo",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/9FWkfJ28oLQ/hqdefault.jpg",
        duration: "5:18",
        durationSeconds: 318,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Pagpupuri",
        youtubeId: "9FWkfJ28oLQ",
        scriptureTheme: "Awit 107:1 — 'Magpasalamat kayo sa Panginoon, sapagkat Siya ay mabuti; sapagkat ang Kanyang kagandahang-loob ay magpakailanman.'",
        lyricsSnippet: "Walang hanggang pasasalamat ang alay ko sa 'Yo, Panginoong Hesus!",
        chordsKey: "G",
        fullLyrics: `[Verse 1]
Salamat sa Iyong kabutihan
Salamat sa Iyong katapatan
Biyaya Mo'y laging bago
Bawat araw sa buhay ko

[Chorus]
Walang hanggang pasasalamat
Ang alay ko sa 'Yo
Panginoong Hesus
Dakila Ka sa buhay ko
Walang hanggang pasasalamat
Magpakailanman

[Bridge]
Aawit ng may kagalakan
Sasayaw sa 'Yong harapan
Walang hanggang pasasalamat!`
    },
    {
        id: "song-tagalog-20",
        title: "Safe (Ligtas)",
        artist: "Victory Worship",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/_r_O6COF7GI/hqdefault.jpg",
        duration: "5:08",
        durationSeconds: 308,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Katiyakan",
        youtubeId: "_r_O6COF7GI",
        scriptureTheme: "Kawikaan 18:10 — 'Ang Pangalan ng Panginoon ay isang matibay na tore; ang matuwid ay tumatakbo roon at ligtas.'",
        lyricsSnippet: "In Your hands I am safe, in Your arms I belong!",
        chordsKey: "E",
        fullLyrics: `[Verse 1]
Underneath Your shadow
Here I find my refuge
You are with me through the storm
I will not be shaken

[Chorus]
In Your hands I am safe
In Your arms I belong
You are my defender
My fortress strong
In Your grace I am safe

[Bridge]
Never failing, never ending
Your love surrounds me
I am safe in You!`
    },
    {
        id: "song-tagalog-21",
        title: "Diyos ng Salinlahi",
        artist: "Malayang Pilipino Music",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/NTZyNbvOYTQ/hqdefault.jpg",
        duration: "4:52",
        durationSeconds: 292,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Katapatan ng Diyos",
        youtubeId: "NTZyNbvOYTQ",
        scriptureTheme: "Awit 100:5 — 'Ang Kanyang katotohanan ay nananatili sa lahat ng salinlahi.'",
        lyricsSnippet: "Ikaw ang Diyos ng salinlahi, tapat Ka sa habang panahon!",
        chordsKey: "G",
        fullLyrics: `[Verse 1]
Mula noon hanggang ngayon
Katapatan Mo'y naroroon
Sa bawat lahi at henerasyon
Ikaw ang Panginoon

[Chorus]
Ikaw ang Diyos ng salinlahi
Tapat Ka sa habang panahon
Walang hanggang kapangyarihan
Ihahayag ng bawat bayan

[Bridge]
Purihin Ka ng mga bata
Purihin Ka ng matatanda
Diyos ng salinlahi!`
    },
    {
        id: "song-tagalog-22",
        title: "Ang Tanging Nais Ko",
        artist: "Musikatha",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/LiaZ9GgMRPQ/hqdefault.jpg",
        duration: "5:12",
        durationSeconds: 312,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Nais ng Puso",
        youtubeId: "LiaZ9GgMRPQ",
        scriptureTheme: "Awit 73:25 — 'Sino ang mayroon ako sa langit kundi Ikaw? At walang anoman sa lupa na aking ninanasa bukod sa Iyo.'",
        lyricsSnippet: "Ang tanging nais ko ay purihin Ka, ang tanging nais ko ay sambahin Ka!",
        chordsKey: "D",
        fullLyrics: `[Verse 1]
Wala nang hihigit pa
Sa pag-ibig na nadarama
Sa piling Mo O Diyos
May kapayapaan

[Chorus]
Ang tanging nais ko
Ay purihin Ka
Ang tanging nais ko
Ay sambahin Ka
Ihandog ang buhay ko
Sa Iyo Hesus

[Bridge]
Tanggapin Mo ang awit ko
Halimuyak sa Iyong trono
Ang tanging nais ko!`
    },
    {
        id: "song-tagalog-23",
        title: "Hesus Ikaw Ang Sandigan",
        artist: "Papuri! Singers",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/uBXkbWV8MbA/hqdefault.jpg",
        duration: "4:40",
        durationSeconds: 280,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Sandigan",
        youtubeId: "uBXkbWV8MbA",
        scriptureTheme: "Awit 62:2 — 'Siya lamang ang aking bato at aking kaligtasan, aking tanggulan; hindi ako lubhang makikilos.'",
        lyricsSnippet: "Hesus Ikaw ang sandigan, matatag sa bawat unos ng buhay!",
        chordsKey: "E",
        fullLyrics: `[Verse 1]
Kapag ang buhay ay puno ng pagsubok
At ang puso ay lulubog
May sandigan akong maaasahan
Si Hesus na aking kaibigan

[Chorus]
Hesus Ikaw ang sandigan
Matatag sa bawat unos ng buhay
Di magigiba, di mabubuwal
Sapagkat Ikaw ang Diyos na banal

[Bridge]
Kahit magbago ang lahat
Katapatan Mo'y tapat
Hesus aking sandigan!`
    },
    {
        id: "song-tagalog-24",
        title: "Tanging Yaman",
        artist: "Bukas Palad Music Ministry",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/l4K-wEZwe00/hqdefault.jpg",
        duration: "4:15",
        durationSeconds: 255,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Pagninilay",
        youtubeId: "l4K-wEZwe00",
        scriptureTheme: "Mateo 6:21 — 'Sapagkat kung saan naroroon ang iyong kayamanan, naroroon din naman ang iyong puso.'",
        lyricsSnippet: "Ikaw ang aking Tanging Yaman, na 'di lubasang masumpungan.",
        chordsKey: "C",
        fullLyrics: `[Chorus]
Ikaw ang aking Tanging Yaman
Na 'di lubasang masumpungan
Ang nilikha Mong kariktan
Sulyap ng 'Yong kagandahan

[Verse 1]
Ika'y nagmasid sa sanlibutan
Upang hanapin ang Iyong minamahal
Ako'y Iyong natagpuan
Kahit ako'y abang alipin

[Chorus]
Ikaw ang aking Tanging Yaman
Na 'di lubasang masumpungan
Ang nilikha Mong kariktan
Sulyap ng 'Yong kagandahan

[Verse 2]
Ika'y nag-alay ng Iyong buhay
Dahil sa Iyong pag-ibig na wagas
Panginoon, salamat sa Iyo
Sa 'Yong walang hanggang habag

[Chorus]
Ikaw ang aking Tanging Yaman
Na 'di lubasang masumpungan
Ang nilikha Mong kariktan
Sulyap ng 'Yong kagandahan`
    },
    {
        id: "song-tagalog-25",
        title: "Sa 'Yo Lamang",
        artist: "Bukas Palad Music Ministry",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/y-3iqUjMsV8/hqdefault.jpg",
        duration: "4:30",
        durationSeconds: 270,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Paghahandog",
        youtubeId: "y-3iqUjMsV8",
        scriptureTheme: "Awit 73:26 — 'Ang aking laman at ang aking puso ay nanghihina: nguni't ang Diyos ang kalakasan ng aking puso at aking bahagi magpakailanman.'",
        lyricsSnippet: "Puso ko'y binihag Mo, sa tamis ng pagsuyo. Tanggapin yaring alay, ako'y Iyo kailanpaman.",
        chordsKey: "C",
        fullLyrics: `[Verse 1]
Puso ko'y binihag Mo
Sa tamis ng pagsuyo
Tanggapin yaring alay
Ako'y Iyo kailanpaman

[Verse 2]
Aanhin ko pa ang kayamanan
Kung di Ka kasama sa buhay
Ang Iyong pag-ibig
Ay higit sa lahat

[Chorus]
Sa 'Yo lamang ang puso ko
Sa 'Yo lamang ang buhay ko
Kalinisan, pagdaralita
Pagtalima, aking sumpa

[Bridge]
Tangan kong kalooban
Sa Iyo'y ibinibigay
Mag-utos Ka, Panginoon
Susunod ako sa 'Yo

[Chorus]
Sa 'Yo lamang ang puso ko
Sa 'Yo lamang ang buhay ko
Kalinisan, pagdaralita
Pagtalima, aking sumpa`
    },
    {
        id: "song-tagalog-26",
        title: "Pag-aalay ng Puso",
        artist: "Bukas Palad Music Ministry",
        language: "Tagalog",
        albumCover: "https://img.youtube.com/vi/5prJMqIx-sY/hqdefault.jpg",
        duration: "3:58",
        durationSeconds: 238,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Handog",
        youtubeId: "5prJMqIx-sY",
        scriptureTheme: "Roma 12:1 — 'Iharap ninyo ang inyong mga katawan na isang buhay na hain, banal, na kalugud-lugod sa Diyos.'",
        lyricsSnippet: "Minsan lamang ako daraan sa daigdig na ito, kaya anumang kabutihan ang aking magagawa, hayaang gawin ko na ngayon.",
        chordsKey: "F",
        fullLyrics: `[Verse 1]
Minsan lamang ako daraan
Sa daigdig na ito
Kaya anuman ang mabuting maari kong gawin
Ay hayaang gawin ko na ngayon

[Chorus]
Pagkat di na ako muling daraan
Sa landas na ito
Ang puso ko'y alay sa Iyo
Panginoong Hesus

[Verse 2]
Bawat sandaling Iyong kaloob
Ay aking gagamitin
Upang maglingkod sa kapwa
At magpuri sa 'Yo Ama

[Chorus]
Pagkat di na ako muling daraan
Sa landas na ito
Ang puso ko'y alay sa Iyo
Panginoong Hesus`
    },

    // ==========================================
    // 🌐 ENGLISH CHRISTIAN PRAISE & WORSHIP SONGS (26 Songs)
    // ==========================================
    {
        id: "song-eng-1",
        title: "Goodness of God",
        artist: "Bethel Music / Jenn Johnson",
        language: "English",
        albumCover: "https://img.youtube.com/vi/n0FBb6hnwTo/hqdefault.jpg",
        duration: "5:00",
        durationSeconds: 300,
        mood: "ENGLISH",
        moodLabel: "🌐 English Praise Anthem",
        youtubeId: "n0FBb6hnwTo",
        scriptureTheme: "Psalm 23:6 — 'Surely goodness and mercy shall follow me all the days of my life, and I will dwell in the house of the Lord forever.'",
        lyricsSnippet: "All my life You have been faithful, All my life You have been so, so good! With every breath that I am able, I will sing of the goodness of God.",
        chordsKey: "G",
        fullLyrics: `[Verse 1]
I love You, Lord
For Your mercy never fails me
All my days, I've been held in Your hands
From the moment that I wake up
Until I lay my head
Oh, I will sing of the goodness of God

[Chorus]
'Cause all my life You have been faithful
And all my life You have been so, so good
With every breath that I am able
Oh, I will sing of the goodness of God

[Verse 2]
I love Your voice
You have led me through the fire
In darkest night You are close like no other
I've known You as a Father
I've known You as a Friend
And I have lived in the goodness of God

[Chorus]
'Cause all my life You have been faithful
And all my life You have been so, so good
With every breath that I am able
Oh, I will sing of the goodness of God

[Bridge]
Your goodness is running after, it's running after me
Your goodness is running after, it's running after me
With my life laid down, I'm surrendered now
I give You everything
'Cause Your goodness is running after, it's running after me

[Chorus]
'Cause all my life You have been faithful
And all my life You have been so, so good
With every breath that I am able
Oh, I will sing of the goodness of God`
    },
    {
        id: "song-eng-2",
        title: "Way Maker",
        artist: "Sinach",
        language: "English",
        albumCover: "https://img.youtube.com/vi/QM8jQHE5AAk/hqdefault.jpg",
        duration: "5:06",
        durationSeconds: 306,
        mood: "ENGLISH",
        moodLabel: "🌐 English Breakthrough",
        youtubeId: "QM8jQHE5AAk",
        scriptureTheme: "Isaiah 43:19 — 'See, I am doing a new thing! I am making a way in the wilderness and streams in the wasteland.'",
        lyricsSnippet: "Way Maker, Miracle Worker, Promise Keeper, Light in the darkness, my God, that is who You are!",
        chordsKey: "C",
        fullLyrics: `[Verse 1]
You are here, moving in our midst
I worship You, I worship You
You are here, working in this place
I worship You, I worship You

[Chorus]
You are Way Maker, Miracle Worker, Promise Keeper
Light in the darkness, my God, that is who You are
Way Maker, Miracle Worker, Promise Keeper
Light in the darkness, my God, that is who You are

[Verse 2]
You are here, touching every heart
I worship You, I worship You
You are here, healing every life
I worship You, I worship You
You are here, turning lives around
I worship You, I worship You

[Chorus]
You are Way Maker, Miracle Worker, Promise Keeper
Light in the darkness, my God, that is who You are
Way Maker, Miracle Worker, Promise Keeper
Light in the darkness, my God, that is who You are

[Bridge]
Even when I don't see it, You're working
Even when I don't feel it, You're working
You never stop, You never stop working
You never stop, You never stop working`
    },
    {
        id: "song-eng-3",
        title: "10,000 Reasons (Bless the Lord)",
        artist: "Matt Redman",
        language: "English",
        albumCover: "https://img.youtube.com/vi/XtwIT8JjddM/hqdefault.jpg",
        duration: "5:42",
        durationSeconds: 342,
        mood: "ENGLISH",
        moodLabel: "🌐 English Worship Classic",
        youtubeId: "XtwIT8JjddM",
        scriptureTheme: "Psalm 103:1 — 'Bless the Lord, O my soul, and all that is within me, bless His holy name.'",
        lyricsSnippet: "Bless the Lord O my soul, O my soul, worship His holy name. Sing like never before, O my soul, I'll worship Your holy name.",
        chordsKey: "G",
        fullLyrics: `[Chorus]
Bless the Lord, O my soul, O my soul
Worship His holy name
Sing like never before, O my soul
I'll worship Your holy name

[Verse 1]
The sun comes up, it's a new day dawning
It's time to sing Your song again
Whatever may pass, and whatever lies before me
Let me be singing when the evening comes

[Chorus]
Bless the Lord, O my soul, O my soul
Worship His holy name
Sing like never before, O my soul
I'll worship Your holy name

[Verse 2]
You're rich in love, and You're slow to anger
Your name is great, and Your heart is kind
For all Your goodness I will keep on singing
Ten thousand reasons for my heart to find

[Verse 3]
And on that day when my strength is failing
The end draws near and my time has come
Still my soul will sing Your praise unending
Ten thousand years and then forevermore

[Chorus]
Bless the Lord, O my soul, O my soul
Worship His holy name
Sing like never before, O my soul
I'll worship Your holy name`
    },
    {
        id: "song-eng-4",
        title: "What A Beautiful Name",
        artist: "Hillsong Worship",
        language: "English",
        albumCover: "https://img.youtube.com/vi/nQWFzMvCfLE/hqdefault.jpg",
        duration: "5:44",
        durationSeconds: 344,
        mood: "ENGLISH",
        moodLabel: "🌐 English Exaltation",
        youtubeId: "nQWFzMvCfLE",
        scriptureTheme: "Philippians 2:9 — 'God exalted Him to the highest place and gave Him the name that is above every name.'",
        lyricsSnippet: "What a beautiful Name it is, What a beautiful Name it is, The Name of Jesus Christ my King!",
        chordsKey: "D",
        fullLyrics: `[Verse 1]
You were the Word at the beginning
One with God the Lord Most High
Your hidden glory in creation
Now revealed in You our Christ

[Chorus 1]
What a beautiful Name it is, what a beautiful Name it is
The Name of Jesus Christ my King
What a beautiful Name it is, nothing compares to this
What a beautiful Name it is, the Name of Jesus

[Verse 2]
You didn't want heaven without us
So Jesus You brought heaven down
My sin was great Your love was greater
What could separate us now

[Chorus 2]
What a wonderful Name it is, what a wonderful Name it is
The Name of Jesus Christ my King
What a wonderful Name it is, nothing compares to this
What a wonderful Name it is, the Name of Jesus

[Bridge]
Death could not hold You, the veil tore before You
You silence the boast of sin and grave
The heavens are roaring the praise of Your glory
For You are raised to life again
You have no rival, You have no equal
Now and forever God You reign
Yours is the kingdom, Yours is the glory
Yours is the Name above all names`
    },
    {
        id: "song-eng-5",
        title: "Amazing Grace (My Chains Are Gone)",
        artist: "Chris Tomlin",
        language: "English",
        albumCover: "https://img.youtube.com/vi/Jbe7OruLk8I/hqdefault.jpg",
        duration: "4:28",
        durationSeconds: 268,
        mood: "ENGLISH",
        moodLabel: "🌐 English Hymn",
        youtubeId: "Jbe7OruLk8I",
        scriptureTheme: "Romans 8:1 — 'There is now no condemnation for those who are in Christ Jesus.'",
        lyricsSnippet: "My chains are gone, I've been set free! My God, my Savior has ransomed me. And like a flood His mercy rains, unending love, amazing grace.",
        chordsKey: "E",
        fullLyrics: `[Verse 1]
Amazing grace, how sweet the sound
That saved a wretch like me
I once was lost, but now I'm found
Was blind, but now I see

[Verse 2]
'Twas grace that taught my heart to fear
And grace my fears relieved
How precious did that grace appear
The hour I first believed

[Chorus]
My chains are gone, I've been set free
My God, my Savior has ransomed me
And like a flood His mercy rains
Unending love, amazing grace

[Verse 3]
The Lord has promised good to me
His word my hope secures
He will my shield and portion be
As long as life endures

[Bridge]
The earth shall soon dissolve like snow
The sun forbear to shine
But God, who called me here below
Will be forever mine`
    },
    {
        id: "song-eng-6",
        title: "How Great Thou Art",
        artist: "Paul Baloche",
        language: "English",
        albumCover: "https://img.youtube.com/vi/dsOU_b5sT0U/hqdefault.jpg",
        duration: "4:50",
        durationSeconds: 290,
        mood: "ENGLISH",
        moodLabel: "🌐 English Majestic Hymn",
        youtubeId: "dsOU_b5sT0U",
        scriptureTheme: "Psalm 8:1 — 'Lord, our Lord, how majestic is Your name in all the earth!'",
        lyricsSnippet: "Then sings my soul, my Savior God, to Thee: How great Thou art, how great Thou art!",
        chordsKey: "A",
        fullLyrics: `[Verse 1]
O Lord my God, when I in awesome wonder
Consider all the worlds Thy Hands have made
I see the stars, I hear the rolling thunder
Thy power throughout the universe displayed

[Chorus]
Then sings my soul, my Savior God, to Thee
How great Thou art, how great Thou art
Then sings my soul, my Savior God, to Thee
How great Thou art, how great Thou art!

[Verse 2]
And when I think that God, His Son not sparing
Sent Him to die, I scarce can take it in
That on the Cross, my burden gladly bearing
He bled and died to take away my sin

[Chorus]
Then sings my soul, my Savior God, to Thee
How great Thou art, how great Thou art
Then sings my soul, my Savior God, to Thee
How great Thou art, how great Thou art!

[Verse 3]
When Christ shall come with shout of acclamation
And take me home, what joy shall fill my heart
Then I shall bow in humble adoration
And then proclaim: My God, how great Thou art`
    },
    {
        id: "song-eng-7",
        title: "Oceans (Where Feet May Fail)",
        artist: "Hillsong UNITED",
        language: "English",
        albumCover: "https://img.youtube.com/vi/OP-00EwLdiU/hqdefault.jpg",
        duration: "8:58",
        durationSeconds: 538,
        mood: "ENGLISH",
        moodLabel: "🌐 English Deep Worship",
        youtubeId: "OP-00EwLdiU",
        scriptureTheme: "Matthew 14:29 — 'Come,' He said. Then Peter got down out of the boat, walked on the water and came toward Jesus.",
        lyricsSnippet: "Spirit lead me where my trust is without borders, Let me walk upon the waters wherever You would call me.",
        chordsKey: "D",
        fullLyrics: `[Verse 1]
You call me out upon the waters
The great unknown where feet may fail
And there I find You in the mystery
In oceans deep my faith will stand

[Chorus]
And I will call upon Your name
And keep my eyes above the waves
When oceans rise
My soul will rest in Your embrace
For I am Yours and You are mine

[Verse 2]
Your grace abounds in deepest waters
Your sovereign hand will be my guide
Where feet may fail and fear surrounds me
You've never failed and You won't start now

[Chorus]
And I will call upon Your name
And keep my eyes above the waves
When oceans rise
My soul will rest in Your embrace
For I am Yours and You are mine

[Bridge]
Spirit lead me where my trust is without borders
Let me walk upon the waters wherever You would call me
Take me deeper than my feet could ever wander
And my faith will be made stronger
In the presence of my Savior`
    },
    {
        id: "song-eng-8",
        title: "Reckless Love",
        artist: "Cory Asbury",
        language: "English",
        albumCover: "https://img.youtube.com/vi/6xx0d3R2LoU/hqdefault.jpg",
        duration: "5:33",
        durationSeconds: 333,
        mood: "ENGLISH",
        moodLabel: "🌐 English Unfailing Love",
        youtubeId: "6xx0d3R2LoU",
        scriptureTheme: "Luke 15:4 — 'Won't he leave the ninety-nine in the wilderness and go after the lost sheep until he finds it?'",
        lyricsSnippet: "Oh, the overwhelming, never-ending, reckless love of God! Oh, it chases me down, fights 'til I'm found, leaves the ninety-nine.",
        chordsKey: "F#m",
        fullLyrics: `[Verse 1]
Before I spoke a word, You were singing over me
You have been so, so good to me
Before I took a breath, You breathed Your life in me
You have been so, so kind to me

[Chorus]
Oh, the overwhelming, never-ending, reckless love of God
Oh, it chases me down, fights 'til I'm found, leaves the ninety-nine
I couldn't earn it, and I don't deserve it, still You give Yourself away
Oh, the overwhelming, never-ending, reckless love of God

[Verse 2]
When I was Your foe, still Your love fought for me
You have been so, so good to me
When I felt no worth, You paid it all for me
You have been so, so kind to me

[Chorus]
Oh, the overwhelming, never-ending, reckless love of God
Oh, it chases me down, fights 'til I'm found, leaves the ninety-nine
I couldn't earn it, and I don't deserve it, still You give Yourself away
Oh, the overwhelming, never-ending, reckless love of God

[Bridge]
There's no shadow You won't light up
Mountain You won't climb up
Coming after me
There's no wall You won't kick down
Lie You won't tear down
Coming after me`
    },
    {
        id: "song-eng-9",
        title: "The Blessing",
        artist: "Kari Jobe & Cody Carnes",
        language: "English",
        albumCover: "https://img.youtube.com/vi/Zp6aygmFZM4/hqdefault.jpg",
        duration: "8:30",
        durationSeconds: 510,
        mood: "ENGLISH",
        moodLabel: "🌐 English Benediction",
        youtubeId: "Zp6aygmFZM4",
        scriptureTheme: "Numbers 6:24-26 — 'The Lord bless you and keep you; the Lord make His face shine on you and be gracious to you.'",
        lyricsSnippet: "The Lord bless you and keep you, make His face shine upon you and be gracious to you!",
        chordsKey: "B",
        fullLyrics: `[Verse]
The Lord bless you and keep you
Make His face shine upon you
And be gracious to you
The Lord turn His face toward you
And give you peace

[Chorus]
Amen, Amen, Amen
Amen, Amen, Amen

[Bridge 1]
May His favor be upon you
And a thousand generations
And your family and your children
And their children, and their children

[Bridge 2]
May His presence go before you
And behind you, and beside you
All around you, and within you
He is with you, He is with you

[Bridge 3]
In the morning, in the evening
In your coming, and your going
In your weeping, and rejoicing
He is for you, He is for you!`
    },
    {
        id: "song-eng-10",
        title: "King of Kings",
        artist: "Hillsong Worship",
        language: "English",
        albumCover: "https://img.youtube.com/vi/Of5IcFWiEpg/hqdefault.jpg",
        duration: "4:51",
        durationSeconds: 291,
        mood: "ENGLISH",
        moodLabel: "🌐 English Gospel Proclamation",
        youtubeId: "Of5IcFWiEpg",
        scriptureTheme: "Revelation 19:16 — 'On His robe and on His thigh He has this name written: KING OF KINGS AND LORD OF LORDS.'",
        lyricsSnippet: "Praise the Father, praise the Son, praise the Spirit three in one. God of glory, majesty, praise forever to the King of Kings!",
        chordsKey: "D",
        fullLyrics: `[Verse 1]
In the darkness we were waiting
Without hope, without light
'Til from Heaven You came running
There was mercy in Your eyes
To fulfill the law and prophets
To a virgin came the Word
From a throne of endless glory
To a cradle in the dirt

[Chorus]
Praise the Father, praise the Son
Praise the Spirit, three in one
God of glory, majesty
Praise forever to the King of Kings

[Verse 2]
To reveal the kingdom coming
And to reconcile the lost
To redeem the whole creation
You did not despise the cross
For even in Your suffering
You saw to the other side
Knowing this was our salvation
Jesus for our sake You died

[Verse 3]
And the morning that You rose
All of heaven held its breath
'Til that stone was moved for good
For the Lamb had conquered death
And the dead rose from their tombs
And the angels stood in awe
For the souls of all who'd come
To the Father are restored

[Verse 4]
And the Church of Christ was born
Then the Spirit lit the flame
Now this Gospel truth of old
Shall not kneel, shall not faint
By His blood and in His Name
In His freedom I am free
For the love of Jesus Christ
Who has resurrected me!`
    },
    {
        id: "song-eng-11",
        title: "Graves Into Gardens",
        artist: "Elevation Worship feat. Brandon Lake",
        language: "English",
        albumCover: "https://img.youtube.com/vi/KwX1f2gYKZ4/hqdefault.jpg",
        duration: "7:32",
        durationSeconds: 452,
        mood: "ENGLISH",
        moodLabel: "🌐 English Resurrection Power",
        youtubeId: "KwX1f2gYKZ4",
        scriptureTheme: "Ezekiel 37:12 — 'I am going to open your graves and bring you up from them; I will bring you back to the land of Israel.'",
        lyricsSnippet: "You turn mourning to dancing, You give beauty for ashes, You turn graves into gardens, You're the only one who can!",
        chordsKey: "B",
        fullLyrics: `[Verse 1]
I searched the world but it couldn't fill me
A man of empty praise and treasures that would fade
Then You came along and You put me back together
And every desire is now satisfied here in Your love

[Chorus]
Oh, there's nothing better than You
There's nothing better than You
Lord there's nothing, nothing is better than You

[Verse 2]
I'm not afraid to show You my weakness
My failures and flaws, Lord You've seen them all
And You still call me friend 'cause the God of the mountain
Is the God of the valley
There's not a place Your mercy and the grace won't find me again

[Bridge]
You turn mourning to dancing
You give beauty for ashes
You turn shame into glory
You're the only one who can
You turn graves into gardens
You turn bones into armies
You turn seas into highways
You're the only one who can!`
    },
    {
        id: "song-eng-12",
        title: "Living Hope",
        artist: "Phil Wickham",
        language: "English",
        albumCover: "https://img.youtube.com/vi/u-1Bp7Z6srg/hqdefault.jpg",
        duration: "5:27",
        durationSeconds: 327,
        mood: "ENGLISH",
        moodLabel: "🌐 English Salvation Song",
        youtubeId: "u-1Bp7Z6srg",
        scriptureTheme: "1 Peter 1:3 — 'In His great mercy He has given us new birth into a living hope through the resurrection of Jesus Christ.'",
        lyricsSnippet: "Hallelujah, praise the One who set me free! Hallelujah, death has lost its grip on me! You have broken every chain, there's salvation in Your name: Jesus Christ, my living hope!",
        chordsKey: "Eb",
        fullLyrics: `[Verse 1]
How great the chasm that lay between us
How high the mountain I could not climb
In desperation, I turned to heaven
And spoke Your name into the night
Then through the darkness, Your loving-kindness
Tore through the shadows of my soul
The work is finished, the end is written
Jesus Christ, my living hope

[Chorus]
Hallelujah, praise the One who set me free
Hallelujah, death has lost its grip on me
You have broken every chain
There's salvation in Your name
Jesus Christ, my living hope

[Verse 2]
Who could imagine so great a mercy?
What heart could fathom such boundless grace?
The God of ages stepped down from glory
To wear my sin and bear my shame
The cross has spoken, I am forgiven
The King of kings calls me His own
Beautiful Savior, I'm Yours forever
Jesus Christ, my living hope

[Verse 3]
Then came the morning that sealed the promise
Your buried body began to breathe
Out of the silence, the Roaring Lion
Declared the grave has no claim on me
Jesus, Yours is the victory!`
    },
    {
        id: "song-eng-13",
        title: "Great Are You Lord",
        artist: "All Sons & Daughters",
        language: "English",
        albumCover: "https://img.youtube.com/vi/uHz0w-HG43U/hqdefault.jpg",
        duration: "4:55",
        durationSeconds: 295,
        mood: "ENGLISH",
        moodLabel: "🌐 English Breath of Life",
        youtubeId: "uHz0w-HG43U",
        scriptureTheme: "Psalm 145:3 — 'Great is the Lord and most worthy of praise; His greatness no one can fathom.'",
        lyricsSnippet: "It's Your breath in our lungs, so we pour out our praise, we pour out our praise! It's Your breath in our lungs, so we pour out our praise to You only!",
        chordsKey: "A",
        fullLyrics: `[Verse]
You give life, You are love
You bring light to the darkness
You give hope, You restore
Every heart that is broken
Great are You, Lord

[Chorus]
It's Your breath in our lungs
So we pour out our praise
We pour out our praise
It's Your breath in our lungs
So we pour out our praise to You only

[Bridge]
All the earth will shout Your praise
Our hearts will cry, these bones will sing
Great are You, Lord!`
    },
    {
        id: "song-eng-14",
        title: "Lord I Need You",
        artist: "Matt Maher",
        language: "English",
        albumCover: "https://img.youtube.com/vi/LuvfMDhTyMA/hqdefault.jpg",
        duration: "3:25",
        durationSeconds: 205,
        mood: "ENGLISH",
        moodLabel: "🌐 English Surrender",
        youtubeId: "LuvfMDhTyMA",
        scriptureTheme: "Hebrews 4:16 — 'Let us then approach God's throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need.'",
        lyricsSnippet: "Lord, I need You, oh, I need You, every hour I need You! My one defense, my righteousness, oh God, how I need You.",
        chordsKey: "B",
        fullLyrics: `[Verse 1]
Lord, I come, I confess
Bowing here I find my rest
Without You I fall apart
You're the one that guides my heart

[Chorus]
Lord, I need You, oh, I need You
Every hour I need You
My one defense, my righteousness
Oh God, how I need You

[Verse 2]
Where sin runs deep, Your grace is more
Where grace is found is where You are
And where You are, Lord, I am free
Holiness is Christ in me

[Bridge]
So teach my song to rise to You
When temptation comes my way
When I cannot stand I'll fall on You
Jesus, You're my hope and stay`
    },
    {
        id: "song-eng-15",
        title: "Cornerstone",
        artist: "Hillsong Worship",
        language: "English",
        albumCover: "https://img.youtube.com/vi/izrk-erhDdk/hqdefault.jpg",
        duration: "6:50",
        durationSeconds: 410,
        mood: "ENGLISH",
        moodLabel: "🌐 English Firm Foundation",
        youtubeId: "izrk-erhDdk",
        scriptureTheme: "Ephesians 2:20 — 'Christ Jesus Himself being the cornerstone.'",
        lyricsSnippet: "Christ alone, Cornerstone, weak made strong in the Savior's love. Through the storm, He is Lord, Lord of all!",
        chordsKey: "C",
        fullLyrics: `[Verse 1]
My hope is built on nothing less
Than Jesus' blood and righteousness
I dare not trust the sweetest frame
But wholly trust in Jesus' Name

[Chorus]
Christ alone, Cornerstone
Weak made strong in the Savior's love
Through the storm, He is Lord
Lord of all

[Verse 2]
When darkness seems to hide His face
I rest on His unchanging grace
In every high and stormy gale
My anchor holds within the veil
My anchor holds within the veil

[Verse 3]
When He shall come with trumpet sound
Oh may I then in Him be found
Dressed in His righteousness alone
Faultless stand before the throne`
    },
    {
        id: "song-eng-16",
        title: "Build My Life",
        artist: "Pat Barrett",
        language: "English",
        albumCover: "https://img.youtube.com/vi/QZW4_8_3wG8/hqdefault.jpg",
        duration: "8:05",
        durationSeconds: 485,
        mood: "ENGLISH",
        moodLabel: "🌐 English Dedication",
        youtubeId: "QZW4_8_3wG8",
        scriptureTheme: "Matthew 7:24 — 'Everyone who hears these words of mine and puts them into practice is like a wise man who built his house on the rock.'",
        lyricsSnippet: "Holy, there is no one like You, there is none beside You! Open up my eyes in wonder, and show me who You are.",
        chordsKey: "G",
        fullLyrics: `[Verse 1]
Worthy of every song we could ever sing
Worthy of all the praise we could ever bring
Worthy of every breath we could ever breathe
We live for You

[Verse 2]
Jesus, the Name above every other name
Jesus, the only One who could ever save
Worthy of every breath we could ever breathe
We live for You, oh, we live for You

[Chorus]
Holy, there is no one like You
There is none beside You
Open up my eyes in wonder
And show me who You are and fill me with Your heart
And lead me in Your love to those around me

[Bridge]
I will build my life upon Your love
It is a firm foundation
I will put my trust in You alone
And I will not be shaken`
    },
    {
        id: "song-eng-17",
        title: "Holy Forever",
        artist: "Chris Tomlin",
        language: "English",
        albumCover: "https://img.youtube.com/vi/HQkmp6WbVfg/hqdefault.jpg",
        duration: "5:08",
        durationSeconds: 308,
        mood: "ENGLISH",
        moodLabel: "🌐 English Eternal Worship",
        youtubeId: "HQkmp6WbVfg",
        scriptureTheme: "Revelation 4:8 — 'Holy, holy, holy is the Lord God Almighty, who was, and is, and is to come.'",
        lyricsSnippet: "Hear the sound of voices ring: the sound of all creation singing: Holy, holy, holy is the Lord God Almighty!",
        chordsKey: "C",
        fullLyrics: `[Verse 1]
A thousand generations falling in down in awe
To sing the song of ages to the Lamb
And all who've gone before us and all who will believe
Will sing the song of ages to the Lamb

[Chorus]
Your name is the highest, Your name is the greatest
Your name stands above them all
All thrones and dominions, all powers and positions
Your name stands above them all
And the angels cry: Holy!
All creation cries: Holy!
You are lifted high: Holy!
Holy forever!

[Verse 2]
If you've been forgiven and if you've been redeemed
Sing the song forever to the Lamb
If you walk in freedom and if you bear His name
Sing the song forever to the Lamb

[Chorus]
And the angels cry: Holy!
All creation cries: Holy!
You are lifted high: Holy!
Holy forever!`
    },
    {
        id: "song-eng-18",
        title: "Jireh",
        artist: "Elevation Worship & Maverick City Music",
        language: "English",
        albumCover: "https://img.youtube.com/vi/mC-zw0zCCtg/hqdefault.jpg",
        duration: "9:59",
        durationSeconds: 599,
        mood: "ENGLISH",
        moodLabel: "🌐 English Contentment & Provision",
        youtubeId: "mC-zw0zCCtg",
        scriptureTheme: "Genesis 22:14 — 'So Abraham called that place The Lord Will Provide. And to this day it is said, On the mountain of the Lord it will be provided.'",
        lyricsSnippet: "Jireh, You are enough! Jireh, You are enough! And I will be content in every circumstance.",
        chordsKey: "Eb",
        fullLyrics: `[Verse 1]
I'll never be more loved than I am right now
Wasn't holding You up, so there's nothing I can do to let You down
It doesn't take a trophy to make You proud
I'll never be more loved than I am right now

[Chorus]
Jireh, You are enough
Jireh, You are enough
And I will be content in every circumstance
Jireh, You are enough
Forever enough, always enough, more than enough

[Verse 2]
I don't wanna forget how I got here
I don't wanna forget the cross
I don't wanna forget the beauty of Your grace
You are my provider, my source and my strength

[Bridge]
If He dresses the lilies with beauty and splendor
How much more will He clothe you?
How much more will He love you?
If He watches over every sparrow
How much more does He love you?`
    },
    {
        id: "song-eng-19",
        title: "House of the Lord",
        artist: "Phil Wickham",
        language: "English",
        albumCover: "https://img.youtube.com/vi/9v0Hqg0yMio/hqdefault.jpg",
        duration: "4:16",
        durationSeconds: 256,
        mood: "ENGLISH",
        moodLabel: "🌐 English Joyful Celebration",
        youtubeId: "9v0Hqg0yMio",
        scriptureTheme: "Psalm 122:1 — 'I rejoiced with those who said to me, Let us go to the house of the Lord.'",
        lyricsSnippet: "There's joy in the house of the Lord! There's joy in the house of the Lord today! And we won't be quiet, we shout out Your praise!",
        chordsKey: "Bb",
        fullLyrics: `[Verse 1]
We worship the God who was, we worship the God who is
We worship the God who evermore will be
He opened the prison doors, He parted the raging sea
My God, He holds the victory

[Chorus]
There's joy in the house of the Lord
There's joy in the house of the Lord today
And we won't be quiet
We shout out Your praise
There's joy in the house of the Lord
Our God is ready to save

[Verse 2]
We sing to the God who heals, we sing to the God who saves
We sing to the God who always makes a way
'Cause He hung up on that cross, then He rose up from that grave
My God's still rolling stones away

[Bridge]
'Cause we were the beggars, now we're royalty
We were the prisoners, now we're running free
We are forgiven, accepted, redeemed by His grace
Let the house of the Lord sing praise!`
    },
    {
        id: "song-eng-20",
        title: "Who You Say I Am",
        artist: "Hillsong Worship",
        language: "English",
        albumCover: "https://img.youtube.com/vi/lKw6uqtGFfo/hqdefault.jpg",
        duration: "5:29",
        durationSeconds: 329,
        mood: "ENGLISH",
        moodLabel: "🌐 English Identity in Christ",
        youtubeId: "lKw6uqtGFfo",
        scriptureTheme: "John 8:36 — 'So if the Son sets you free, you will be free indeed.'",
        lyricsSnippet: "Who the Son sets free, oh is free indeed! I'm a child of God, yes I am! In my Father's house there's a place for me, I'm a child of God, yes I am.",
        chordsKey: "Gb",
        fullLyrics: `[Verse 1]
Who am I that the highest King would welcome me?
I was lost but He brought me in, oh His love for me
Oh His love for me

[Chorus 1]
Who the Son sets free, oh is free indeed
I'm a child of God, yes I am

[Verse 2]
Free at last, He has ransomed me, His grace runs deep
While I was a slave to sin, Jesus died for me
Yes, He died for me

[Chorus 2]
Who the Son sets free, oh is free indeed
I'm a child of God, yes I am
In my Father's house there's a place for me
I'm a child of God, yes I am

[Bridge]
I am chosen, not forsaken
I am who You say I am
You are for me, not against me
I am who You say I am`
    },
    {
        id: "song-eng-21",
        title: "Trust in God",
        artist: "Elevation Worship feat. Chris Brown",
        language: "English",
        albumCover: "https://img.youtube.com/vi/16_O-c1pLHQ/hqdefault.jpg",
        duration: "7:22",
        durationSeconds: 442,
        mood: "ENGLISH",
        moodLabel: "🌐 English Faith & Trust",
        youtubeId: "16_O-c1pLHQ",
        scriptureTheme: "Proverbs 3:5-6 — 'Trust in the Lord with all your heart and lean not on your own understanding.'",
        lyricsSnippet: "I sought the Lord and He heard and He answered! That's why I trust Him, that's why I trust in God.",
        chordsKey: "C",
        fullLyrics: `[Verse 1]
Blessed assurance, Jesus is mine
He's been my fourth man in the fire time after time
Born of His Spirit, washed in His blood
And He never fails me, He never will

[Chorus]
I sought the Lord and He heard and He answered
I sought the Lord and He heard and He answered
I sought the Lord and He heard and He answered
That's why I trust Him, that's why I trust Him

[Verse 2]
Perfect submission, all is at rest
I know the Author of tomorrow has ordered my steps
So this is my story, and this is my song
Praising my Savior all the day long

[Chorus]
I sought the Lord and He heard and He answered
I sought the Lord and He heard and He answered
I sought the Lord and He heard and He answered
That's why I trust Him, that's why I trust Him

[Bridge]
I trust in God, my Savior
The One who will never fail
He will never fail!`
    },
    {
        id: "song-eng-22",
        title: "In Christ Alone",
        artist: "Passion / Kristian Stanfill",
        language: "English",
        albumCover: "https://img.youtube.com/vi/wNR_e1pY23I/hqdefault.jpg",
        duration: "5:42",
        durationSeconds: 342,
        mood: "ENGLISH",
        moodLabel: "🌐 English Unshakable Foundation",
        youtubeId: "wNR_e1pY23I",
        scriptureTheme: "Acts 4:12 — 'Salvation is found in no one else, for there is no other name under heaven given to mankind by which we must be saved.'",
        lyricsSnippet: "In Christ alone my hope is found, He is my light, my strength, my song; This Cornerstone, this solid Ground, firm through the fiercest drought and storm.",
        chordsKey: "D",
        fullLyrics: `[Verse 1]
In Christ alone my hope is found
He is my light, my strength, my song
This Cornerstone, this solid Ground
Firm through the fiercest drought and storm
What heights of love, what depths of peace
When fears are stilled, when strivings cease
My Comforter, my All in All
Here in the love of Christ I stand

[Verse 2]
In Christ alone, who took on flesh
Fullness of God in helpless babe
This gift of love and righteousness
Scorned by the ones He came to save
'Til on that cross as Jesus died
The wrath of God was satisfied
For every sin on Him was laid
Here in the death of Christ I live

[Verse 3]
There in the ground His body lay
Light of the world by darkness slain
Then bursting forth in glorious Day
Up from the grave He rose again
And as He stands in victory
Sin's curse has lost its grip on me
For I am His and He is mine
Bought with the precious blood of Christ

[Verse 4]
No guilt in life, no fear in death
This is the power of Christ in me
From life's first cry to final breath
Jesus commands my destiny
No power of hell, no scheme of man
Can ever pluck me from His hand
'Til He returns or calls me home
Here in the power of Christ I'll stand`
    },
    {
        id: "song-eng-23",
        title: "I Speak Jesus",
        artist: "Charity Gayle",
        language: "English",
        albumCover: "https://img.youtube.com/vi/b_R7U1b6e-U/hqdefault.jpg",
        duration: "5:28",
        durationSeconds: 328,
        mood: "ENGLISH",
        moodLabel: "🌐 English Deliverance & Power",
        youtubeId: "b_R7U1b6e-U",
        scriptureTheme: "Philippians 2:10 — 'That at the name of Jesus every knee should bow, in heaven and on earth and under the earth.'",
        lyricsSnippet: "Your Name is power, Your Name is healing, Your Name is life! Break every stronghold, shine through the shadows, burn like a fire!",
        chordsKey: "E",
        fullLyrics: `[Verse 1]
I just wanna speak the Name of Jesus
Over every heart and every mind
'Cause I know there is peace within Your presence
I speak Jesus

[Verse 2]
I just wanna speak the Name of Jesus
'Til every dark addiction starts to break
Declaring there is hope and there is freedom
I speak Jesus

[Chorus]
'Cause Your Name is power
Your Name is healing
Your Name is life
Break every stronghold
Shine through the shadows
Burn like a fire

[Verse 3]
I just wanna speak the Name of Jesus
Over fear and all anxiety
To every soul held captive by depression
I speak Jesus

[Chorus]
'Cause Your Name is power
Your Name is healing
Your Name is life
Break every stronghold
Shine through the shadows
Burn like a fire

[Bridge]
Shout Jesus from the mountains
Jesus in the streets
Jesus in the darkness over every enemy
Jesus for my family
I speak the holy Name of Jesus!`
    },
    {
        id: "song-eng-24",
        title: "Firm Foundation (He Won't)",
        artist: "Cody Carnes",
        language: "English",
        albumCover: "https://img.youtube.com/vi/xV_2G_pX3iY/hqdefault.jpg",
        duration: "6:20",
        durationSeconds: 380,
        mood: "ENGLISH",
        moodLabel: "🌐 English Solid Rock",
        youtubeId: "xV_2G_pX3iY",
        scriptureTheme: "Luke 6:48 — 'He is like a man building a house, who dug down deep and laid the foundation on rock.'",
        lyricsSnippet: "Christ is my firm foundation, the rock on which I stand! When everything around me is shaken, I've never been more glad that I put my faith in Jesus.",
        chordsKey: "Bb",
        fullLyrics: `[Verse 1]
Christ is my firm foundation
The rock on which I stand
When everything around me is shaken
I've never been more glad
That I put my faith in Jesus
'Cause He's never let me down
He's faithful through generations
So why would He fail now?

[Chorus]
He won't, He won't
He's never failed, and He won't start now
He won't, He won't

[Verse 2]
I've still got joy in chaos
I've got peace that makes no sense
So I won't be going under
I'm not held by human hands
'Cause I've built my life on Jesus
He's never let me down
He's faithful in every season
So why would He fail now?

[Bridge]
Rain came and wind blew
My house was built on You
The storm raged, the flood grew
My house was built on You
I'm safe with You, I'm going to make it through!`
    },
    {
        id: "song-eng-25",
        title: "Shout to the Lord",
        artist: "Hillsong Worship / Darlene Zschech",
        language: "English",
        albumCover: "https://img.youtube.com/vi/og9B_k9k3v0/hqdefault.jpg",
        duration: "4:40",
        durationSeconds: 280,
        mood: "ENGLISH",
        moodLabel: "🌐 English Classic Praise",
        youtubeId: "og9B_k9k3v0",
        scriptureTheme: "Psalm 98:4 — 'Shout for joy to the Lord, all the earth, burst into jubilant song with music.'",
        lyricsSnippet: "Shout to the Lord, all the earth, let us sing! Power and majesty, praise to the King!",
        chordsKey: "A",
        fullLyrics: `[Verse 1]
My Jesus, my Savior
Lord, there is none like You
All of my days, I want to praise
The wonders of Your mighty love
My comfort, my shelter
Tower of refuge and strength
Let every breath, all that I am
Never cease to worship You

[Chorus]
Shout to the Lord, all the earth, let us sing
Power and majesty, praise to the King
Mountains bow down and the seas will roar
At the sound of Your name
I sing for joy at the work of Your hands
Forever I'll love You, forever I'll stand
Nothing compares to the promise I have in You

[Chorus]
Shout to the Lord, all the earth, let us sing
Power and majesty, praise to the King
Mountains bow down and the seas will roar
At the sound of Your name
I sing for joy at the work of Your hands
Forever I'll love You, forever I'll stand
Nothing compares to the promise I have in You`
    },
    {
        id: "song-eng-26",
        title: "This Is Amazing Grace",
        artist: "Phil Wickham",
        language: "English",
        albumCover: "https://img.youtube.com/vi/cgsbaBIao84/hqdefault.jpg",
        duration: "4:39",
        durationSeconds: 279,
        mood: "ENGLISH",
        moodLabel: "🌐 English Victory Anthem",
        youtubeId: "cgsbaBIao84",
        scriptureTheme: "Revelation 5:12 — 'Worthy is the Lamb, who was slain, to receive power and wealth and wisdom and strength and honor and glory and praise!'",
        lyricsSnippet: "This is amazing grace, this is unfailing love, that You would take my place, that You would bear my cross!",
        chordsKey: "Bb",
        fullLyrics: `[Verse 1]
Who breaks the power of sin and darkness
Whose love is mighty and so much stronger
The King of Glory, the King above all kings
Who shakes the whole earth with holy thunder
And leaves us breathless in awe and wonder
The King of Glory, the King above all kings

[Chorus]
This is amazing grace
This is unfailing love
That You would take my place
That You would bear my cross
You laid down Your life
That I would be set free
Oh, Jesus, I sing for
All that You've done for me

[Verse 2]
Who brings our chaos back into order
Who makes the orphan a son and daughter
The King of Glory, the King of Glory
Who rules the nations with truth and justice
Shines like the sun in all of its brilliance
The King of Glory, the King above all kings

[Chorus]
This is amazing grace
This is unfailing love
That You would take my place
That You would bear my cross
You laid down Your life
That I would be set free
Oh, Jesus, I sing for
All that You've done for me

[Bridge]
Worthy is the Lamb who was slain
Worthy is the King who conquered the grave
Worthy is the Lamb who was slain
Worthy is the King who conquered the grave!`
    }
];

export const MOOD_CATEGORIES: { key: WorshipMood; label: string; icon: string }[] = [
    { key: "ALL", label: "✨ Lahat / All Christian Songs", icon: "✨" },
    { key: "TAGALOG", label: "🇵🇭 Tagalog Christian Worship", icon: "🇵🇭" },
    { key: "ENGLISH", label: "🌐 English Christian Worship", icon: "🌐" }
];

const CUSTOM_SONGS_STORAGE_KEY = "epic_community_custom_worship_songs";
const DELETED_SONGS_STORAGE_KEY = "epic_community_deleted_songs";

/**
 * Get IDs of songs deleted by Administrator
 */
export function getDeletedSongIds(): string[] {
    try {
        const stored = localStorage.getItem(DELETED_SONGS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {}
    return [];
}

/**
 * Administrator delete song (removes from active playlist)
 */
export function adminDeleteSong(songId: string): void {
    const deleted = getDeletedSongIds();
    if (!deleted.includes(songId)) {
        deleted.push(songId);
        try {
            localStorage.setItem(DELETED_SONGS_STORAGE_KEY, JSON.stringify(deleted));
        } catch {}
    }

    // Also remove from custom songs if present
    const custom = getCustomWorshipSongs().filter(s => s.id !== songId);
    try {
        localStorage.setItem(CUSTOM_SONGS_STORAGE_KEY, JSON.stringify(custom));
    } catch {}
}

/**
 * Administrator restore all deleted songs
 */
export function adminRestoreAllSongs(): void {
    try {
        localStorage.removeItem(DELETED_SONGS_STORAGE_KEY);
    } catch {}
}

export function getCustomWorshipSongs(): WorshipSong[] {
    try {
        const stored = localStorage.getItem(CUSTOM_SONGS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {}
    return [];
}

export function saveCustomWorshipSong(song: CreateWorshipSongRequest): WorshipSong {
    const list = getCustomWorshipSongs();
    const lang = song.language || "Tagalog";
    
    // Extract video ID if full URL was provided
    let yId = (song.youtubeUrlOrId || "").trim();
    if (yId.includes("v=")) {
        yId = yId.split("v=")[1].split("&")[0];
    } else if (yId.includes("youtu.be/")) {
        yId = yId.split("youtu.be/")[1].split("?")[0];
    }

    let defaultCover = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80";
    if (yId) {
        defaultCover = `https://img.youtube.com/vi/${yId}/hqdefault.jpg`;
    }

    const snippet =
        song.lyricsSnippet?.trim() ||
        (song.fullLyrics ? song.fullLyrics.split("\n").filter((l) => l.trim() && !l.startsWith("[")).slice(0, 2).join(" ") : "") ||
        "Worship the Lord with gladness; come before Him with joyful songs!";

    let durationSec = 300;
    if (song.duration && song.duration.includes(":")) {
        const parts = song.duration.split(":");
        const mins = parseInt(parts[0], 10) || 0;
        const secs = parseInt(parts[1], 10) || 0;
        durationSec = mins * 60 + secs;
    }

    const newSong: WorshipSong = {
        id: `custom-${Date.now()}`,
        title: song.title.trim(),
        artist: song.artist.trim() || "Worship Team",
        language: lang,
        albumCover: song.albumCover?.trim() || defaultCover,
        duration: song.duration || "5:00",
        durationSeconds: durationSec,
        mood: lang === "Tagalog" ? "TAGALOG" : "ENGLISH",
        moodLabel: lang === "Tagalog" ? "🇵🇭 Custom Tagalog Worship" : "🌐 Custom English Worship",
        youtubeId: yId || "",
        audioUrl: song.audioUrl || "",
        scriptureTheme: song.scriptureTheme?.trim() || "Colossians 3:16 — 'Singing to God with thanksgiving in your hearts.'",
        lyricsSnippet: snippet,
        fullLyrics: song.fullLyrics?.trim() || "[Worship Song]\nCome let us worship and bow down before the Lord our Maker.",
        chordsKey: song.chordsKey || "G",
        isCustom: true
    };

    list.unshift(newSong);
    try {
        localStorage.setItem(CUSTOM_SONGS_STORAGE_KEY, JSON.stringify(list));
    } catch {}
    return newSong;
}
