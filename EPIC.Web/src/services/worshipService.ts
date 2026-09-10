/**
 * EPIC Worship Music Service
 * Pure Christian Praise & Worship Songs (Tagalog & English Only - No Worldly Songs)
 * 100% Real Studio/Live Master Recordings via Official YouTube Integration
 * Complete, Authentic Word-for-Word Lyrics (Verse, Chorus, Bridge, Pre-Chorus)
 * Supports Admin Song Deletion & Storage
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
    chordsKey: "C" | "G" | "D" | "E" | "A";
    isCustom?: boolean;
}

export const WORSHIP_PLAYLIST: WorshipSong[] = [
    // ==========================================
    // 🇵🇭 TAGALOG CHRISTIAN PRAISE & WORSHIP SONGS
    // ==========================================
    {
        id: "song-tagalog-1",
        title: "Diyos Ka Sa Amin",
        artist: "Hope Filipino Worship",
        language: "Tagalog",
        albumCover: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
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
        albumCover: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80",
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
        albumCover: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=400&q=80",
        duration: "4:48",
        durationSeconds: 288,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Soaking",
        youtubeId: "zjVBIQfnYhQ",
        scriptureTheme: "Awit 84:10 — 'Sapagkat ang isang araw sa Iyong mga looban ay higit na mabuti kaysa sanlibong araw sa iba.'",
        lyricsSnippet: "Loobin Mong ang buhay ko'y maging banal Mong tahanan, luklukan ng Iyong wagas na pagsinta.",
        chordsKey: "D",
        fullLyrics: `[Verse]
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

[Verse]
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
        albumCover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80",
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
        albumCover: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80",
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

[Verse 1]
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
        artist: "Ptr. Luis 'Boy' Baldomaro",
        language: "Tagalog",
        albumCover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
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

    // ==========================================
    // 🌐 ENGLISH CHRISTIAN PRAISE & WORSHIP SONGS
    // ==========================================
    {
        id: "song-eng-1",
        title: "Goodness of God",
        artist: "Bethel Music / Jenn Johnson",
        language: "English",
        albumCover: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
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
        albumCover: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=400&q=80",
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
You are here, mending every heart
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
        albumCover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
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
        albumCover: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=400&q=80",
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
        albumCover: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80",
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

[Verse 4]
The earth shall soon dissolve like snow
The sun forbear to shine
But God, who called me here below
Will be forever mine`
    },
    {
        id: "song-eng-6",
        title: "How Great Thou Art",
        artist: "Carrie Underwood",
        language: "English",
        albumCover: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=400&q=80",
        duration: "4:50",
        durationSeconds: 290,
        mood: "ENGLISH",
        moodLabel: "🌐 English Majestic Hymn",
        youtubeId: "Yf6C0L_7-CA",
        scriptureTheme: "Psalm 8:1 — 'O Lord, our Lord, how majestic is Your name in all the earth!'",
        lyricsSnippet: "Then sings my soul, my Savior God, to Thee: How great Thou art, how great Thou art!",
        chordsKey: "A",
        fullLyrics: `[Verse 1]
O Lord my God, when I in awesome wonder
Consider all the worlds Thy hands have made
I see the stars, I hear the rolling thunder
Thy power throughout the universe displayed

[Chorus]
Then sings my soul, my Savior God, to Thee
How great Thou art, how great Thou art
Then sings my soul, my Savior God, to Thee
How great Thou art, how great Thou art

[Verse 2]
And when I think that God, His Son not sparing
Sent Him to die, I scarce can take it in
That on the cross, my burden gladly bearing
He bled and died to take away my sin

[Verse 3]
When Christ shall come, with shout of acclamation
And take me home, what joy shall fill my heart
Then I shall bow in humble adoration
And then proclaim: My God, how great Thou art`
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

export function saveCustomWorshipSong(song: {
    title: string;
    artist: string;
    youtubeUrlOrId?: string;
    audioUrl?: string;
    language?: "Tagalog" | "English";
    scriptureTheme?: string;
    lyricsSnippet?: string;
    fullLyrics?: string;
}): WorshipSong {
    const list = getCustomWorshipSongs();
    const lang = song.language || "Tagalog";
    
    // Extract video ID if full URL was provided
    let yId = (song.youtubeUrlOrId || song.audioUrl || "").trim();
    if (yId.includes("v=")) {
        yId = yId.split("v=")[1].split("&")[0];
    } else if (yId.includes("youtu.be/")) {
        yId = yId.split("youtu.be/")[1].split("?")[0];
    }

    const newSong: WorshipSong = {
        id: `custom-${Date.now()}`,
        title: song.title.trim(),
        artist: song.artist.trim() || "Worship Team",
        language: lang,
        albumCover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
        duration: "5:00",
        durationSeconds: 300,
        mood: lang === "Tagalog" ? "TAGALOG" : "ENGLISH",
        moodLabel: lang === "Tagalog" ? "🇵🇭 Custom Tagalog Worship" : "🌐 Custom English Worship",
        youtubeId: yId || "n0FBb6hnwTo",
        scriptureTheme: song.scriptureTheme?.trim() || "Colossians 3:16 — 'Singing to God with thanksgiving in your hearts.'",
        lyricsSnippet: song.lyricsSnippet?.trim() || "Worship the Lord with gladness; come before Him with joyful songs!",
        fullLyrics: song.fullLyrics?.trim() || "[Worship Song]\nCome let us worship and bow down before the Lord our Maker.",
        chordsKey: "G",
        isCustom: true
    };

    list.unshift(newSong);
    try {
        localStorage.setItem(CUSTOM_SONGS_STORAGE_KEY, JSON.stringify(list));
    } catch {}
    return newSong;
}
